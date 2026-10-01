import "./support/alias.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { checkProject } = await import("../lib/project/checks.ts");

function component(reference, name, labels = {}) {
  return { id: `${reference}:${name}`, recipe: { reference, name, fields: {}, labels }, files: [] };
}

const selectorIssues = (components) =>
  checkProject(components, () => null).filter((issue) => issue.id.startsWith("svc-selector:"));

test("a Service named after its Deployment selects its pods", () => {
  assert.deepEqual(selectorIssues([component("k8s/deployment", "shop"), component("k8s/service", "shop")]), []);
});

test("extra Service labels stay metadata and do not break the selector", () => {
  const components = [component("k8s/deployment", "shop"), component("k8s/service", "frontend", { app: "shop", tier: "web" })];
  assert.deepEqual(selectorIssues(components), []);
});

test("warns when the selector matches a Deployment label that its pods do not carry", () => {
  const components = [component("k8s/deployment", "shop", { app: "store" }), component("k8s/service", "store")];
  const issues = selectorIssues(components);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, "warning");
  assert.deepEqual(issues[0].title.values, { service: "store", selector: "app=store" });
  assert.deepEqual(issues[0].componentIds, ["k8s/service:store"]);
});
