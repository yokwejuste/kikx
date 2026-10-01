import { test } from "node:test";
import assert from "node:assert/strict";
import { gettingStarted } from "../lib/project/getting-started.ts";

const FRESH = { checksOpened: false, downloaded: false, dismissed: false, collapsed: false };

const doneSteps = (progress) => progress.items.filter((item) => item.done).map((item) => item.step);

test("an empty project has nothing done", () => {
  const progress = gettingStarted([], 0, FRESH);
  assert.equal(progress.done, 0);
  assert.equal(progress.total, 5);
  assert.equal(progress.complete, false);
});

test("component kinds tick the matching steps", () => {
  const progress = gettingStarted(["inventory", "playbook"], 1, FRESH);
  assert.deepEqual(doneSteps(progress), ["servers", "playbook"]);
});

test("checks count as reviewed once opened or when there are no errors", () => {
  assert.deepEqual(doneSteps(gettingStarted([], 0, { ...FRESH, checksOpened: true })), ["checks"]);
  assert.deepEqual(doneSteps(gettingStarted(["inventory"], 0, FRESH)), ["servers", "checks"]);
});

test("every step done completes the checklist", () => {
  const progress = gettingStarted(["inventory", "groupvars", "playbook"], 2, { ...FRESH, checksOpened: true, downloaded: true });
  assert.equal(progress.done, 5);
  assert.equal(progress.complete, true);
});
