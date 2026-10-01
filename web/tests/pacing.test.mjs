import { test } from "node:test";
import assert from "node:assert/strict";
import { readingTime, typingDelay } from "../lib/teach/pacing.ts";

test("longer captions get more reading time, within a floor and a ceiling", () => {
  const short = readingTime("Add it.");
  const medium = readingTime("The files render live as you type. This is exactly what lands in your repo.");
  const long = readingTime("word ".repeat(200));
  assert.equal(short, 1800);
  assert.ok(medium > short);
  assert.equal(long, 9000);
});

test("typing has an uneven rhythm and breathes after spaces and punctuation", () => {
  assert.ok(typingDelay("a", 0) < typingDelay("a", 1));
  assert.ok(typingDelay(" ", 0.5) > typingDelay("a", 0.5));
  assert.ok(typingDelay(":", 0.5) > typingDelay("b", 0.5));
});
