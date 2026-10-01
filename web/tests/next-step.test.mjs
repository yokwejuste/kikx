import { test } from "node:test";
import assert from "node:assert/strict";
import { nextStep } from "../lib/registry/next-step.ts";

const STAGES = [["server"], ["inventory", "groupvars"], ["playbook", "site", "role"], ["deployment", "service"]];

test("suggests the next entry in the same stage", () => {
  assert.equal(nextStep(STAGES, new Set(["inventory"]), "inventory"), "groupvars");
  assert.equal(nextStep(STAGES, new Set(["playbook"]), "playbook"), "site");
});

test("moves to the next stage once the current one is covered", () => {
  assert.equal(nextStep(STAGES, new Set(["inventory", "groupvars"]), "groupvars"), "playbook");
});

test("skips entries already present", () => {
  assert.equal(nextStep(STAGES, new Set(["playbook", "site", "role"]), "playbook"), "deployment");
  assert.equal(nextStep(STAGES, new Set(["inventory", "playbook"]), "inventory"), "groupvars");
});

test("returns null at the end of the flow or for an unknown kind", () => {
  assert.equal(nextStep(STAGES, new Set(["service"]), "service"), null);
  assert.equal(nextStep(STAGES, new Set(["deployment", "service"]), "deployment"), null);
  assert.equal(nextStep(STAGES, new Set(), "custom"), null);
});
