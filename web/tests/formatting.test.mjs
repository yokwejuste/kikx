import { test } from "node:test";
import assert from "node:assert/strict";
import { checkYaml, formatYaml, nextLineIndent } from "../lib/format/yaml.ts";
import {
  formatKeyValues,
  isVariableName,
  keyProblems,
  keyValueProblems,
  parseKeyValuePairs,
} from "../lib/format/key-value.ts";

test("formatYaml re-indents to two spaces and keeps comments and scalars as written", () => {
  const messy = "# web tier\nport:    0443\nflag: yes\nmsg: \"{{ x }}\"   # note\nlist:\n- a\n-    b\nmap:\n      deep:   1\n";
  assert.equal(
    formatYaml(messy),
    "# web tier\nport: 0443\nflag: yes\nmsg: \"{{ x }}\" # note\nlist:\n  - a\n  - b\nmap:\n  deep: 1\n",
  );
});

test("formatYaml leaves tidy YAML untouched", () => {
  const tidy = "nginx_sites:\n  - name: shop\n    port: 443\n    tls: true\napp_env: production\n";
  assert.equal(formatYaml(tidy), tidy);
  assert.equal(formatYaml("a: 1"), "a: 1");
  assert.equal(formatYaml(""), "");
});

test("formatYaml never rewrites invalid YAML", () => {
  for (const broken of ["a: 1\na: 2\n", "a:\n\tb: 1\n", "key: [1, 2\n", "a: 1\n  b: 2\n"]) {
    assert.equal(formatYaml(broken), broken);
  }
});

test("checkYaml reports the line and a reason per problem", () => {
  assert.deepEqual(checkYaml("a: 1\nb: 2\n"), []);
  assert.deepEqual(
    checkYaml("a: 1\na: 2\n").map(({ line, reason }) => ({ line, reason })),
    [{ line: 2, reason: "duplicateKey" }],
  );
  assert.equal(checkYaml("a:\n\tb: 1\n")[0].reason, "tabIndent");
  assert.equal(checkYaml("b: plain: colon\n")[0].reason, "colonInValue");
  assert.equal(checkYaml("a: 1\n---\nb: 2\n")[0].reason, "multipleDocs");
  const [problem] = checkYaml("key: [1, 2\n");
  assert.ok(problem.to > problem.from);
});

test("nextLineIndent follows YAML structure", () => {
  assert.equal(nextLineIndent("key: value"), "");
  assert.equal(nextLineIndent("key:"), "  ");
  assert.equal(nextLineIndent("  key:   # comment"), "    ");
  assert.equal(nextLineIndent("script: |"), "  ");
  assert.equal(nextLineIndent("- item"), "");
  assert.equal(nextLineIndent("  - name: shop"), "    ");
  assert.equal(nextLineIndent("- debug:"), "    ");
  assert.equal(nextLineIndent("-"), "  ");
});

test("isVariableName follows Ansible rules", () => {
  assert.ok(isVariableName("app_port"));
  assert.ok(isVariableName("_private2"));
  assert.ok(!isVariableName("2fast"));
  assert.ok(!isVariableName("app-port"));
  assert.ok(!isVariableName("app.port"));
});

test("formatKeyValues puts one pair per line, trims around = and quotes spaced values", () => {
  assert.equal(formatKeyValues("a = 1  b=2\n\nmotd=hello world\n# keep\n", "\n"), "a=1\nb=2\nmotd=\"hello world\"\n# keep");
  assert.equal(formatKeyValues("  a=1\n b = 'x y'  ", " "), "a=1 b='x y'");
  assert.equal(formatKeyValues("say=he said \"hi\"", " "), "say='he said \"hi\"'");
});

test("formatKeyValues keeps stray text instead of dropping it", () => {
  assert.equal(formatKeyValues("oops a=1", " "), "oops a=1");
  assert.equal(formatKeyValues("=1\nb=2", "\n"), "=1\nb=2");
});

test("keyValueProblems flags bad names, duplicates and missing parts", () => {
  assert.deepEqual(keyValueProblems("a=1 b=2", " "), []);
  assert.deepEqual(keyValueProblems("a=1\na=2\na=3", "\n"), [{ kind: "duplicate", key: "a" }]);
  assert.deepEqual(keyValueProblems("app-port=80", " "), [{ kind: "name", key: "app-port" }]);
  assert.deepEqual(keyValueProblems("app-port=80", " ", false), []);
  assert.deepEqual(keyValueProblems("oops\n=1", "\n"), [
    { kind: "noEquals", text: "oops" },
    { kind: "noKey", text: "=1" },
  ]);
});

test("keyProblems checks each row against the ones before it", () => {
  assert.deepEqual(keyProblems(["a", "", "a", "9x"], true), [
    null,
    null,
    { kind: "duplicate", key: "a" },
    { kind: "name", key: "9x" },
  ]);
});

test("parseKeyValuePairs keeps quoted values whole", () => {
  assert.deepEqual(parseKeyValuePairs("a=1 msg='x y' b = 2"), [
    ["a", "1"],
    ["msg", "'x y'"],
    ["b", "2"],
  ]);
});
