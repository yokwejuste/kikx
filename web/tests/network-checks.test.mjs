import "./support/alias.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { checkProject } = await import("../lib/project/checks.ts");

const FORMATS = { "terraform/hetzner": { private_network: "cidr" }, "terraform/aws": { private_network: "cidr" } };
const fieldFormat = (reference, field) => FORMATS[reference]?.[field] ?? null;

function inventory(id, members, group = "web") {
  const hosts = [{ group, members: members.map(([name, address]) => ({ name, ansible_host: address })) }];
  return { id, recipe: { reference: "ansible/inventory", name: id, fields: { hosts: JSON.stringify(hosts) }, labels: {} }, files: [] };
}

function server(id, reference, fields) {
  return { id, recipe: { reference, name: id, fields, labels: {} }, files: [] };
}

const issuesWith = (components, prefix) => checkProject(components, fieldFormat).filter((issue) => issue.id.startsWith(prefix));

test("warns when two hosts across inventories share an address", () => {
  const issues = issuesWith(
    [inventory("prod", [["web-1", "10.0.0.5"]]), inventory("staging", [["web-2", "10.0.0.5"], ["web-3", "10.0.0.6"]])],
    "shared-addr:",
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, "warning");
  assert.equal(issues[0].title.key, "checks.issues.sharedAddress.title");
  assert.deepEqual(issues[0].title.values, { count: 2, address: "10.0.0.5", hosts: "web-1, web-2" });
  assert.deepEqual(issues[0].componentIds, ["prod", "staging"]);
});

test("compares normalised addresses", () => {
  const issues = issuesWith([inventory("prod", [["a", "2001:db8::1"], ["b", "2001:0db8:0::1"]])], "shared-addr:");
  assert.equal(issues.length, 1);
  assert.deepEqual(issues[0].componentIds, ["prod"]);
});

test("one host listed in several groups or inventories is not a shared address", () => {
  const components = [inventory("prod", [["web-1", "10.0.0.5"]]), inventory("other", [["web-1", "10.0.0.5"]], "db")];
  assert.deepEqual(issuesWith(components, "shared-addr:"), []);
});

test("warns when two components' private networks overlap", () => {
  const issues = issuesWith(
    [
      server("edge", "terraform/hetzner", { private_network: "10.0.0.0/8" }),
      server("core", "terraform/aws", { private_network: "10.20.0.0/16" }),
      server("lab", "terraform/aws", { private_network: "192.168.0.0/16" }),
    ],
    "range-overlap:",
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, "warning");
  assert.deepEqual(issues[0].title.values, { first: "edge", firstRange: "10.0.0.0/8", second: "core", secondRange: "10.20.0.0/16" });
  assert.deepEqual(issues[0].componentIds, ["edge", "core"]);
});

test("ignores fields without the cidr format, empty values and invalid ranges", () => {
  const components = [
    server("edge", "terraform/hetzner", { private_network: "10.0.0.0/16", region: "10.0.0.0/16" }),
    server("core", "terraform/aws", { private_network: "" }),
    server("lab", "terraform/aws", { private_network: "10.0.0.7/16" }),
    server("misc", "terraform/linode", { private_network: "10.0.0.0/16" }),
  ];
  assert.deepEqual(issuesWith(components, "range-overlap:"), []);
});
