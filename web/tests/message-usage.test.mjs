import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const SOURCE_DIRS = ["app", "components", "lib"];

const DYNAMIC_PREFIXES = {
  "registry.": "French titles and descriptions looked up by registry reference in use-catalog-text",
};

function sourceFiles(dir) {
  return readdirSync(join(webRoot, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function literals(source) {
  const plain = new Set();
  const patterns = [];
  for (const [, , text] of source.matchAll(/(["'])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) plain.add(text.replace(/\.$/, ""));
  for (const [, text] of source.matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
    if (!text.includes("${")) {
      plain.add(text);
      continue;
    }
    const parts = text.split(/\$\{[^}]*\}/);
    if (/[a-z]/i.test(parts.join(""))) patterns.push(new RegExp(`^${parts.map(escapeRegex).join("[^.]+")}$`));
  }
  return { plain, patterns };
}

function leafKeys(node, prefix) {
  return Object.entries(node).flatMap(([name, value]) => {
    const path = `${prefix}.${name}`;
    return value && typeof value === "object" && !Array.isArray(value) ? leafKeys(value, path) : [path];
  });
}

function messageKeys() {
  const root = JSON.parse(readFileSync(join(webRoot, "messages/en.json"), "utf8"));
  const keys = Object.entries(root).flatMap(([name, value]) =>
    value && typeof value === "object" ? leafKeys(value, name) : [name],
  );
  const lessonDir = join(webRoot, "messages/lessons/en");
  for (const file of readdirSync(lessonDir)) {
    const lesson = JSON.parse(readFileSync(join(lessonDir, file), "utf8"));
    keys.push(...leafKeys(lesson, `teach.lessons.${file.replace(/\.json$/, "")}`));
  }
  return keys;
}

test("every message key is referenced from code", () => {
  const plain = new Set();
  const patterns = [];
  for (const file of SOURCE_DIRS.flatMap(sourceFiles)) {
    const found = literals(readFileSync(join(webRoot, file), "utf8"));
    for (const text of found.plain) plain.add(text);
    patterns.push(...found.patterns);
  }
  const matches = (text) => text === "" || plain.has(text) || patterns.some((pattern) => pattern.test(text));

  const referenced = (key) => {
    const segments = key.split(".");
    for (let split = 0; split < segments.length; split += 1) {
      const namespace = segments.slice(0, split).join(".");
      const rest = segments.slice(split).join(".");
      if (matches(rest) && matches(namespace)) return true;
    }
    return false;
  };

  const unused = messageKeys()
    .filter((key) => !Object.keys(DYNAMIC_PREFIXES).some((prefix) => key.startsWith(prefix)))
    .filter((key) => !referenced(key));
  assert.deepEqual(unused, []);
});
