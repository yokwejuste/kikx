import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { LESSONS, lessonMinutes, lessonSayKeys, lessonTargets } from "../lib/teach/lessons.ts";

const LOCALES = ["en", "fr"];
const SOURCE_DIRS = ["app", "components"];

function load(locale) {
  return JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")).teach;
}

function sources(dir) {
  return readdirSync(new URL(`../${dir}/`, import.meta.url), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => readFileSync(`${entry.parentPath}/${entry.name}`, "utf8"))
    .join("\n");
}

const code = SOURCE_DIRS.map(sources).join("\n");

function markerExists(attribute, id) {
  if (code.includes(`${attribute}="${id}"`)) return true;
  const dash = id.indexOf("-");
  return dash > 0 && code.includes(`${attribute}={\`${id.slice(0, dash)}-`);
}

test("every lesson has a title, a description and every caption in each language", () => {
  for (const locale of LOCALES) {
    const messages = load(locale);
    for (const lesson of LESSONS) {
      const text = messages.lessons[lesson.id];
      assert.ok(text?.title, `${locale}: ${lesson.id} has no title`);
      assert.ok(text?.description, `${locale}: ${lesson.id} has no description`);
      for (const key of lessonSayKeys(lesson)) assert.ok(text.steps?.[key], `${locale}: ${lesson.id}.steps.${key} is missing`);
    }
  }
});

test("every demo value a lesson types exists in each language", () => {
  for (const locale of LOCALES) {
    const demo = load(locale).demo;
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        if (step.kind === "type" && step.value !== "projectName") assert.ok(demo[step.value], `${locale}: demo.${step.value}`);
      }
    }
  }
});

test("every element a lesson targets is marked in the code", () => {
  for (const lesson of LESSONS) {
    for (const selector of lessonTargets(lesson)) {
      for (const [, attribute, id] of selector.matchAll(/\[(data-[a-z]+)="([^"]+)"\]/g)) {
        assert.ok(markerExists(attribute, id), `${lesson.id}: nothing has ${attribute}="${id}"`);
      }
    }
  }
});

test("lesson ids are unique and every lesson takes at least a minute", () => {
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
  for (const lesson of LESSONS) assert.ok(lessonMinutes(lesson) >= 1);
});
