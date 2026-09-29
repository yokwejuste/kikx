import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const FRENCH_ONLY = "registry";

function load(locale) {
  return JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
}

function keys(node, prefix = "") {
  return Object.entries(node).flatMap(([name, value]) => {
    const path = prefix ? `${prefix}.${name}` : name;
    return value && typeof value === "object" ? keys(value, path) : [path];
  });
}

function shared(messages) {
  return new Set(keys(messages).filter((key) => !key.startsWith(`${FRENCH_ONLY}.`)));
}

test("English and French messages have the same keys", () => {
  const english = shared(load("en"));
  const french = shared(load("fr"));
  assert.deepEqual([...english].filter((key) => !french.has(key)), []);
  assert.deepEqual([...french].filter((key) => !english.has(key)), []);
});

test("messages contain no em dash, en dash, double hyphen or double underscore", () => {
  for (const locale of ["en", "fr"]) {
    const text = readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8");
    for (const forbidden of ["\u2014", "\u2013", "-".repeat(2), "_".repeat(2)]) {
      assert.equal(text.includes(forbidden), false, `${locale}.json contains ${JSON.stringify(forbidden)}`);
    }
  }
});
