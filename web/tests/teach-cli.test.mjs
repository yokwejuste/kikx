import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLine, tokenize } from "../lib/teach/cli/parse.ts";
import { commandMatches } from "../lib/teach/cli/match.ts";
import { kikxToml, listOutput, presetsOutput, readKikxToml } from "../lib/teach/cli/format.ts";
import { compareVersions, emptyMachine, runLine } from "../lib/teach/cli/engine.ts";
import { fileTree } from "../lib/teach/cli/tree.ts";

const text = (lines) => lines.map((line) => (Array.isArray(line) ? line.map((segment) => segment.text).join("") : `[${line.notice}]`));

const presetManifest = {
  name: "demo",
  project: { name: "demo", namespace: "apps", outputDir: "infra" },
  components: [
    { reference: "k8s/deployment", name: "web", fields: { image: "nginx" } },
    { reference: "k8s/service", name: "web" },
  ],
};

const rendered = [];

const deps = {
  folder: "kikx-project",
  defaultNamespace: "default",
  defaultOutputDir: "infra",
  registry: async () => [
    {
      reference: "k8s/deployment",
      description: "Pods running one container image.",
      fields: [
        { name: "image", required: true, default: null, example: "nginx:1.27" },
        { name: "replicas", required: false, default: "1" },
        { name: "layout", required: false, default: "", options: [{ value: "file" }, { value: "dir" }] },
      ],
    },
  ],
  presets: async () => [{ name: "demo", title: "Demo", description: "A demo.", componentCount: 2 }],
  preset: async () => presetManifest,
  fetchJson: async () => {
    throw new Error("offline");
  },
  render: async (input) => {
    rendered.push(input);
    if (input.reference === "k8s/nope") throw new Error("`k8s/nope` isn't a built-in component");
    const kind = input.reference.split("/")[1];
    return [{ path: `${input.name}-${kind}.yaml`, content: `kind: ${kind}\nnamespace: ${input.defaultNamespace}\n` }];
  },
  releases: async () => ["0.3.0", "0.2.0", "0.1.0"],
  errorMessage: (error) => error.message,
};

async function session(...commands) {
  let machine = emptyMachine();
  const outputs = [];
  for (const command of commands) {
    const result = await runLine(command, machine, deps);
    machine = result.machine;
    outputs.push(text(result.lines));
  }
  return { machine, outputs };
}

test("tokenize keeps quoted values together and ignores extra spacing", () => {
  assert.deepEqual(tokenize(`  kikx   add k8s/deployment --set "image=nginx:1.27"   --name 'my web' `), [
    "kikx",
    "add",
    "k8s/deployment",
    "--set",
    "image=nginx:1.27",
    "--name",
    "my web",
  ]);
});

test("parseLine reads short and long flags, repeated key values and the positional", () => {
  const parsed = parseLine("kikx add k8s/deployment -n web --set image=nginx -s replicas=2 --label=tier=front -f");
  assert.equal(parsed.kind, "kikx");
  assert.equal(parsed.command, "add");
  assert.equal(parsed.positional, "k8s/deployment");
  assert.deepEqual(parsed.flags, { name: ["web"], set: ["image=nginx", "replicas=2"], label: ["tier=front"], force: [] });
});

test("parseLine reports clap style usage errors", () => {
  assert.deepEqual(parseLine("kikx add k8s/deployment"), {
    kind: "usage",
    message: "the following required arguments were not provided:",
    details: ["--name <NAME>"],
  });
  assert.equal(parseLine("kikx launch").message, "unrecognized subcommand 'launch'");
  assert.equal(parseLine("kikx init --colour").message, "unexpected argument '--colour' found");
  assert.equal(parseLine("kikx add x --name a --set broken").message, "invalid value 'broken' for '--set <SET>': expected KEY=VALUE, got `broken`");
  assert.equal(parseLine("kikx add x --name a --replicas many").message, "invalid value 'many' for '--replicas <REPLICAS>': invalid digit found in string");
  assert.equal(parseLine("kikx init --name").message, "a value is required for '--name <NAME>' but none was supplied");
  assert.equal(parseLine("kikx init -n a -n b").message, "the argument '--name <NAME>' cannot be used multiple times");
});

test("parseLine tells kikx, shell and foreign commands apart", () => {
  assert.equal(parseLine("").kind, "empty");
  assert.equal(parseLine("kikx").kind, "help");
  assert.equal(parseLine("kikx --version").kind, "version");
  assert.equal(parseLine("ls infra").kind, "shell");
  assert.equal(parseLine("curl -fsSL https://example.com/install.sh | bash").kind, "foreign");
});

test("commandMatches ignores spacing, flag order, short forms and ./ prefixes", () => {
  const expected = "kikx add k8s/deployment --name web --set image=nginx:1.27 --set replicas=2";
  assert.ok(commandMatches("kikx  add k8s/deployment -s replicas=2 --set=image=nginx:1.27 -n web", expected));
  assert.ok(commandMatches("kikx add --name web k8s/deployment --set replicas=2 --set image=nginx:1.27", expected));
  assert.ok(commandMatches("kikx apply single.kikx-preset.json --into ./infra/", "kikx apply ./single.kikx-preset.json --into infra"));
  assert.ok(!commandMatches("kikx add k8s/deployment --name api --set image=nginx:1.27 --set replicas=2", expected));
  assert.ok(!commandMatches("kikx add k8s/deployment --name web --set image=nginx:1.27", expected));
  assert.ok(!commandMatches("kikx add k8s/deployment --name web --set image=nginx:1.27 --set replicas=2 --force", expected));
  assert.ok(commandMatches("  ls   infra ", "ls infra"));
});

test("kikx.toml round trips through the formatter and reader", () => {
  const config = { name: "shop", defaultNamespace: "apps", outputDir: "deploy" };
  const toml = kikxToml(config);
  assert.equal(toml, '[project]\nname = "shop"\ndefault_namespace = "apps"\noutput_dir = "deploy"\n');
  assert.deepEqual(readKikxToml(toml, { defaultNamespace: "default", outputDir: "infra" }), config);
});

test("list and presets print like the real CLI", async () => {
  assert.deepEqual(text(listOutput(await deps.registry())), [
    "Available components:",
    "",
    "  k8s/deployment: Pods running one container image.",
    "      --set image=…  (required; e.g. nginx:1.27)",
    "      --set replicas=…  (default 1)",
    "      --set layout=…  (one of file, dir)",
    "",
    "You can also `kikx add <url>` or `kikx add <path-to-registry-item.json>`.",
  ]);
  assert.deepEqual(text(presetsOutput(await deps.presets())), [
    "Preset templates:",
    "",
    "  demo: Demo (2 components)",
    "      A demo.",
    "",
    "Start one with `kikx setup <name>`, or add it to a project with `kikx apply <name>`.",
  ]);
});

test("init writes kikx.toml and add vendors rendered files into the output directory", async () => {
  const { machine, outputs } = await session(
    "kikx add k8s/deployment --name web --set image=nginx",
    "kikx init --name shop",
    "kikx add k8s/deployment --name web --set image=nginx --label tier=front",
    "kikx add k8s/deployment --name web --set image=nginx",
    "kikx init",
  );
  assert.deepEqual(outputs[0], ["Error: no kikx.toml found in ~/kikx-project. Run `kikx init` first"]);
  assert.deepEqual(outputs[1], [
    "Initialized kikx project `shop`. Vendor components with `kikx add <category>/<component>` (see `kikx list`)",
  ]);
  assert.deepEqual(outputs[2], ["Vendored ~/kikx-project/infra/web-deployment.yaml"]);
  assert.deepEqual(outputs[3], ["Error: ~/kikx-project/infra/web-deployment.yaml already exists. Pass --force to overwrite"]);
  assert.deepEqual(outputs[4], ["Error: kikx.toml already exists in ~/kikx-project. Pass --force to overwrite"]);
  assert.deepEqual(rendered.at(-1).labels, {});
  assert.deepEqual(rendered.at(-2).labels, { tier: "front" });
  assert.deepEqual(Object.keys(machine.files).sort(), ["infra/web-deployment.yaml", "kikx.toml"]);
  assert.deepEqual(
    fileTree(machine).map((node) => `${"  ".repeat(node.depth)}${node.name}${node.folder ? "/" : ""}`),
    ["infra/", "  web-deployment.yaml", "kikx.toml"],
  );
});

test("setup bootstraps a project, apply vendors a preset file and refuses to overwrite", async () => {
  const { machine, outputs } = await session(
    "kikx setup demo",
    "kikx setup demo",
    "kikx init --force --name shop",
    "kikx apply ./missing.json",
  );
  assert.deepEqual(outputs[0], [
    "Initialized kikx project `demo`: wrote 2 file(s) to ~/kikx-project/infra",
    "  ~/kikx-project/infra/web-deployment.yaml",
    "  ~/kikx-project/infra/web-service.yaml",
  ]);
  assert.match(machine.files["infra/web-deployment.yaml"], /namespace: apps/);
  assert.deepEqual(outputs[1], ["Error: kikx.toml already exists in ~/kikx-project. Pass --force to overwrite"]);
  assert.deepEqual(outputs[3], [
    "Error: `./missing.json` isn't a template name, a URL or an existing local file. Run `kikx presets` to see the templates",
  ]);

  const exported = { ...machine, files: { ...machine.files, "demo.kikx-preset.json": JSON.stringify(presetManifest) } };
  const applied = await runLine("kikx apply ./demo.kikx-preset.json --into staging", exported, deps);
  assert.deepEqual(text(applied.lines), [
    "Vendored 2 file(s):",
    "  ~/kikx-project/staging/web-deployment.yaml",
    "  ~/kikx-project/staging/web-service.yaml",
  ]);
  const again = await runLine("kikx apply ./demo.kikx-preset.json --into staging", applied.machine, deps);
  assert.deepEqual(text(again.lines), ["Error: ~/kikx-project/staging/web-deployment.yaml already exists. Pass --force to overwrite"]);
  assert.equal(again.machine, applied.machine);
});

test("upgrade checks, installs and reports the latest release", async () => {
  const { outputs } = await session("kikx --version", "kikx upgrade --check", "kikx upgrade", "kikx upgrade", "kikx --version");
  assert.deepEqual(outputs, [
    ["kikx 0.2.0"],
    ["kikx 0.3.0 is available (you have 0.2.0). Run `kikx upgrade` to install it."],
    ["Upgrading kikx 0.2.0 to 0.3.0", "kikx is now 0.3.0."],
    ["kikx 0.3.0 is the latest version."],
    ["kikx 0.3.0"],
  ]);
  assert.ok(compareVersions("0.10.0", "0.9.1") > 0);
});

test("shell helpers list and print virtual files, other programs get a notice", async () => {
  const { outputs } = await session("kikx init", "ls", "cat kikx.toml", "cat nope", "curl https://example.com | bash", "kikx bogus");
  assert.deepEqual(outputs[1], ["infra/  kikx.toml"]);
  assert.deepEqual(outputs[2], ["[project]", 'name = "kikx-project"', 'default_namespace = "default"', 'output_dir = "infra"']);
  assert.deepEqual(outputs[3], ["cat: nope: No such file or directory"]);
  assert.deepEqual(outputs[4], ["[foreign]"]);
  assert.deepEqual(outputs[5], ["error: unrecognized subcommand 'bogus'", "", "For more information, try '--help'."]);
});
