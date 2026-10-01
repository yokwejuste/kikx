import "./support/alias.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  #items = new Map();
  get length() {
    return this.#items.size;
  }
  key(index) {
    return [...this.#items.keys()][index] ?? null;
  }
  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null;
  }
  setItem(key, value) {
    this.#items.set(key, String(value));
  }
  removeItem(key) {
    this.#items.delete(key);
  }
}

globalThis.localStorage = new MemoryStorage();
const { beginSandbox, claimOrphanedSandbox, endSandbox, hasClaimedSandbox, SANDBOX_KEY } = await import("../lib/teach/sandbox.ts");

const PROJECT = JSON.stringify({ details: { name: "mine" }, components: [] });
const LESSON = JSON.stringify({ details: { name: "lesson" }, components: [] });

beforeEach(() => {
  endSandbox(false);
  globalThis.localStorage = new MemoryStorage();
  localStorage.setItem("kikx:project", PROJECT);
  localStorage.setItem("kikx.tour.seen.builder", "1");
  localStorage.setItem("kikx-teach:speed", "1");
});

const lockedElsewhere = () =>
  new Promise((ready) => {
    let release;
    void navigator.locks.request(SANDBOX_KEY, () => {
      ready(() => release());
      return new Promise((resolve) => (release = resolve));
    });
  });

test("the project is set aside in localStorage, outside the project keys", () => {
  assert.deepEqual(beginSandbox("/build"), { hadProject: true });
  assert.equal(localStorage.getItem("kikx:project"), null);
  assert.equal(localStorage.getItem("kikx.tour.seen.builder"), "1");
  const saved = JSON.parse(localStorage.getItem(SANDBOX_KEY));
  assert.equal(saved.saved["kikx:project"], PROJECT);
  assert.equal(saved.returnPath, "/build");
});

test("a sandbox whose lesson is still running is not orphaned", async () => {
  beginSandbox("/build");
  assert.equal(await claimOrphanedSandbox(), false);
  assert.equal(hasClaimedSandbox(), false);
});

test("closing the lesson tab leaves an orphan that the next page restores", async () => {
  localStorage.setItem(SANDBOX_KEY, JSON.stringify({ returnPath: "/build", saved: { "kikx:project": PROJECT } }));
  localStorage.setItem("kikx:project", LESSON);
  assert.equal(hasClaimedSandbox(), false);
  assert.equal(await claimOrphanedSandbox(), true);
  assert.equal(localStorage.getItem("kikx:project"), LESSON);
  assert.equal(hasClaimedSandbox(), true);
  assert.equal(endSandbox(false), "/build");
  assert.equal(localStorage.getItem("kikx:project"), PROJECT);
  assert.equal(localStorage.getItem(SANDBOX_KEY), null);
  assert.equal(localStorage.getItem("kikx-teach:speed"), "1");
});

test("a lesson running in another tab is neither restored over nor replaced", async () => {
  localStorage.setItem(SANDBOX_KEY, JSON.stringify({ returnPath: "/", saved: { "kikx:project": PROJECT } }));
  localStorage.setItem("kikx:project", LESSON);
  const release = await lockedElsewhere();
  assert.equal(await claimOrphanedSandbox(), false);
  assert.equal(hasClaimedSandbox(), false);
  assert.equal(beginSandbox("/build"), null);
  assert.equal(JSON.parse(localStorage.getItem(SANDBOX_KEY)).saved["kikx:project"], PROJECT);
  release();
});

test("keep this project keeps the lesson's project and drops the saved copy", () => {
  localStorage.removeItem("kikx:project");
  assert.deepEqual(beginSandbox("/"), { hadProject: false });
  localStorage.setItem("kikx:project", LESSON);
  endSandbox(true);
  assert.equal(localStorage.getItem("kikx:project"), LESSON);
  assert.equal(localStorage.getItem(SANDBOX_KEY), null);
});

test("stopping the lesson puts the project back", () => {
  beginSandbox("/build");
  localStorage.setItem("kikx:project", LESSON);
  localStorage.setItem("kikx:draft", "x");
  assert.equal(endSandbox(false), "/build");
  assert.equal(localStorage.getItem("kikx:project"), PROJECT);
  assert.equal(localStorage.getItem("kikx:draft"), null);
});
