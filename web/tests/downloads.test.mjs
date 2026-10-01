import { test } from "node:test";
import assert from "node:assert/strict";
import { projectFingerprint } from "../lib/project/downloads.ts";

const details = { name: "demo", namespace: "default", outputDir: "out" };

function component(id, content) {
  return { id, recipe: {}, files: [{ fileName: `${id}.yml`, component: id, content }] };
}

test("the fingerprint is stable for the same project", () => {
  const components = [component("a", "one"), component("b", "two")];
  assert.equal(projectFingerprint(details, components), projectFingerprint(details, structuredClone(components)));
});

test("the fingerprint changes when a component or a file changes", () => {
  const base = projectFingerprint(details, [component("a", "one")]);
  assert.notEqual(projectFingerprint(details, [component("a", "changed")]), base);
  assert.notEqual(projectFingerprint(details, [component("a", "one"), component("b", "two")]), base);
  assert.notEqual(projectFingerprint(details, []), base);
  assert.notEqual(projectFingerprint({ ...details, outputDir: "other" }, [component("a", "one")]), base);
});
