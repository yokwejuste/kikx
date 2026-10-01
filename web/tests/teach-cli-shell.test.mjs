import { test } from "node:test";
import assert from "node:assert/strict";
import { freshCursor, remember, stepHistory, HISTORY_LIMIT } from "../lib/teach/cli/history.ts";
import { controlAction, editLine } from "../lib/teach/cli/line-edit.ts";
import { closestName, editDistance } from "../lib/teach/cli/suggest.ts";
import { readReplay, replayUrl, sessionScript, withoutReplay, REPLAY_LIMIT } from "../lib/teach/cli/replay.ts";
import { complete } from "../lib/teach/cli/complete.ts";
import { emptyMachine, listDirectory, runLine } from "../lib/teach/cli/engine.ts";
import { clampSplit, splitFromKey, DEFAULT_SPLIT, SPLIT_STEP } from "../lib/dom/split.ts";

test("remember skips blanks and consecutive duplicates and keeps a bounded list", () => {
  assert.deepEqual(remember([], "  "), []);
  assert.deepEqual(remember(["kikx list"], "kikx list"), ["kikx list"]);
  assert.deepEqual(remember(["kikx list", "ls"], "kikx list"), ["kikx list", "ls", "kikx list"]);
  const full = Array.from({ length: HISTORY_LIMIT }, (_, index) => `cmd ${index}`);
  const next = remember(full, "last");
  assert.equal(next.length, HISTORY_LIMIT);
  assert.equal(next.at(-1), "last");
  assert.equal(next[0], "cmd 1");
});

test("stepHistory walks older and newer and restores the draft", () => {
  const history = ["kikx init", "kikx list", "ls"];
  let cursor = freshCursor();
  const walk = (direction, line) => {
    const step = stepHistory(history, cursor, direction, line);
    if (step) cursor = step.cursor;
    return step?.line ?? null;
  };
  assert.equal(walk("newer", "kik"), null);
  assert.equal(walk("older", "kik"), "ls");
  assert.equal(walk("older", "ls"), "kikx list");
  assert.equal(walk("older", "kikx list"), "kikx init");
  assert.equal(walk("older", "kikx init"), null);
  assert.equal(walk("newer", "kikx init"), "kikx list");
  assert.equal(walk("newer", "kikx list"), "ls");
  assert.equal(walk("newer", "ls"), "kik");
  assert.deepEqual(cursor, freshCursor());
  assert.equal(stepHistory([], freshCursor(), "older", "x"), null);
});

test("editLine handles the shell control keys", () => {
  const line = { value: "kikx add k8s/deployment --name web", start: 9, end: 9 };
  assert.deepEqual(editLine("start", line), { value: line.value, cursor: 0 });
  assert.deepEqual(editLine("end", line), { value: line.value, cursor: line.value.length });
  assert.deepEqual(editLine("clear", line), { value: "", cursor: 0 });
  assert.deepEqual(editLine("deleteToEnd", line), { value: "kikx add ", cursor: 9 });
  assert.deepEqual(editLine("deleteWord", line), { value: "kikx k8s/deployment --name web", cursor: 5 });
  assert.deepEqual(editLine("deleteWord", { value: "kikx  ", start: 6, end: 6 }), { value: "", cursor: 0 });
  assert.deepEqual(editLine("deleteWord", { value: "kikx list", start: 5, end: 9 }), { value: "kikx ", cursor: 5 });
  assert.equal(controlAction("A"), "start");
  assert.equal(controlAction("w"), "deleteWord");
  assert.equal(controlAction("v"), null);
});

test("editDistance and closestName suggest the nearest valid name", () => {
  assert.equal(editDistance("kitten", "sitting"), 3);
  assert.equal(editDistance("", "abc"), 3);
  assert.equal(closestName("setup-server", ["single-server", "web-app", "static-site"]), "single-server");
  assert.equal(closestName("stup", ["setup", "apply", "list"]), "setup");
  assert.equal(closestName("deploymnt", ["k8s/deployment", "k8s/service"]), "k8s/deployment");
  assert.equal(closestName("k8s/servce", ["k8s/deployment", "k8s/service"]), "k8s/service");
  assert.equal(closestName("zzzzzzzz", ["setup", "apply"]), null);
  assert.equal(closestName("setup", ["setup", "apply"]), null);
  assert.equal(closestName("", ["setup"]), null);
});

test("replay links round-trip the session commands", () => {
  const commands = ["kikx init", "  ", "kikx add k8s/deployment --name web --set image=nginx"];
  assert.equal(sessionScript(commands), "kikx init\nkikx add k8s/deployment --name web --set image=nginx");
  const url = replayUrl("https://example.test/learn/cli?teach=x#top", commands);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/learn/cli");
  assert.equal(parsed.hash, "");
  assert.equal(parsed.searchParams.get("teach"), null);
  assert.deepEqual(readReplay(parsed.search), ["kikx init", "kikx add k8s/deployment --name web --set image=nginx"]);
  assert.deepEqual(readReplay("?other=1"), []);
  const many = Array.from({ length: REPLAY_LIMIT + 5 }, (_, index) => `ls ${index}`);
  assert.equal(readReplay(new URL(replayUrl("https://example.test/learn/cli", many)).search).length, REPLAY_LIMIT);
  assert.equal(withoutReplay("https://example.test/learn/cli?replay=ls&keep=1#a"), "/learn/cli?keep=1#a");
});

const machine = {
  ...emptyMachine(),
  files: { "kikx.toml": "", "infra/web-deployment.yaml": "", "infra/web-service.yaml": "", "preset.json": "" },
  dirs: ["infra"],
};

const sources = {
  templates: async () => ["single-server", "static-site", "web-app"],
  components: async () => ["k8s/deployment", "k8s/service", "docker/compose"],
  listDirectory: (path) => listDirectory(machine, path),
};

const tab = (line, cursor = line.length) => complete(line, cursor, sources);

test("complete fills a single match inline", async () => {
  assert.deepEqual(await tab("ki"), { line: "kikx ", cursor: 5, matches: ["kikx"] });
  assert.equal((await tab("kikx se")).line, "kikx setup ");
  assert.equal((await tab("kikx setup sin")).line, "kikx setup single-server ");
  assert.equal((await tab("kikx add docker/")).line, "kikx add docker/compose ");
  assert.equal((await tab("kikx init --di")).line, "kikx init --dir ");
  assert.equal((await tab("cat infra/web-d")).line, "cat infra/web-deployment.yaml ");
  assert.equal((await tab("cat in")).line, "cat infra/");
  assert.equal((await tab("ls k")).line, "ls kikx.toml ");
});

test("complete extends to the common prefix and reports the choices", async () => {
  const prefix = await tab("kikx add k8s");
  assert.equal(prefix.line, "kikx add k8s/");
  assert.deepEqual(prefix.matches, ["k8s/deployment", "k8s/service"]);
  const stuck = await tab("kikx a");
  assert.equal(stuck.line, "kikx a");
  assert.deepEqual(stuck.matches, ["add", "apply"]);
  const files = await tab("cat infra/");
  assert.deepEqual(files.matches, ["infra/web-deployment.yaml", "infra/web-service.yaml"]);
  assert.equal(files.line, "cat infra/web-");
});

test("complete knows flags, values and finished positionals", async () => {
  const flags = await tab("kikx setup --");
  assert.deepEqual(flags.matches, ["--force", "--help"]);
  assert.deepEqual((await tab("kikx add k8s/service --name web --na")).matches, ["--namespace"]);
  assert.deepEqual((await tab("kikx add --name ")).matches, []);
  assert.deepEqual((await tab("kikx setup web-app s")).matches, []);
  assert.deepEqual((await tab("kikx list x")).matches, []);
  assert.deepEqual((await tab("echo hi")).matches, []);
  assert.ok((await tab("kikx setup ")).matches.includes("preset.json"));
  assert.ok((await tab("kikx add k8s/service -s a=b --")).matches.includes("--set"));
});

test("complete keeps the text after the cursor", async () => {
  const result = await tab("kikx pre --help", 8);
  assert.equal(result.line, "kikx presets --help");
  assert.equal(result.cursor, 13);
});

const deps = {
  folder: "kikx-project",
  defaultNamespace: "default",
  defaultOutputDir: "infra",
  registry: async () => [{ reference: "k8s/deployment", description: "", fields: [] }],
  presets: async () => [{ name: "single-server", title: "", description: "", componentCount: 1 }],
  preset: async () => ({ components: [] }),
  fetchJson: async () => {
    throw new Error("offline");
  },
  render: async (input) => {
    if (input.reference !== "k8s/deployment") throw new Error(`\`${input.reference}\` isn't a built-in component`);
    return [{ path: "web.yaml", content: "" }];
  },
  releases: async () => ["0.2.0", "0.1.0"],
  errorMessage: (error) => error.message,
};

async function lines(...commands) {
  let state = emptyMachine();
  let result = null;
  for (const command of commands) {
    result = await runLine(command, state, deps);
    state = result.machine;
  }
  return result.lines;
}

test("errors keep the real CLI text and add a did-you-mean tip", async () => {
  const subcommand = await lines("kikx stup");
  assert.deepEqual(subcommand[0], [{ text: "error:", tone: "error" }, { text: " unrecognized subcommand 'stup'" }]);
  assert.deepEqual(subcommand.at(-1), { tip: "setup" });

  const template = await lines("kikx setup setup-server");
  assert.equal(template[0][1].text.includes("isn't a template name"), true);
  assert.deepEqual(template.at(-1), { tip: "single-server" });

  const component = await lines("kikx init", "kikx add k8s/deploymnt --name web");
  assert.deepEqual(component[0][1], { text: " `k8s/deploymnt` isn't a built-in component" });
  assert.deepEqual(component.at(-1), { tip: "k8s/deployment" });

  const unrelated = await lines("kikx init", "kikx add zzzzzzzzzz --name web");
  assert.equal(unrelated.some((line) => "tip" in line), false);
});

test("clampSplit keeps both panes above their minimum width", () => {
  assert.equal(clampSplit(0.1, 1000, 300), 0.3);
  assert.equal(clampSplit(0.95, 1000, 300), 0.7);
  assert.equal(clampSplit(0.42, 1000, 300), 0.42);
  assert.equal(clampSplit(0.2, 500, 300), DEFAULT_SPLIT);
  assert.equal(splitFromKey("ArrowLeft", 0.5), 0.5 - SPLIT_STEP);
  assert.equal(splitFromKey("ArrowRight", 0.5), 0.5 + SPLIT_STEP);
  assert.equal(splitFromKey("Home", 0.5), 0);
  assert.equal(splitFromKey("Enter", 0.5), null);
});
