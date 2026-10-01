import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { LESSONS, lessonMinutes } from "../lib/teach/lessons/index.ts";

const LOCALES = ["en", "fr"];
const SOURCE_DIRS = ["app", "components"];
const FORBIDDEN = ["—", "–", "-".repeat(2), "_".repeat(2)];

const lessonFile = (locale, id) => new URL(`../messages/lessons/${locale}/${id}.json`, import.meta.url);
const load = (locale, id) => JSON.parse(readFileSync(lessonFile(locale, id), "utf8"));

function keys(node, prefix = "") {
  return Object.entries(node).flatMap(([name, value]) => {
    const path = prefix ? `${prefix}.${name}` : name;
    return value && typeof value === "object" ? keys(value, path) : [path];
  });
}

function allSteps(steps) {
  return steps.flatMap((step) => (step.kind === "task" ? [step, ...allSteps(step.show)] : [step]));
}

function targets(step) {
  const found = [];
  if (step.target) found.push(step.target);
  if (step.kind === "task") found.push(...step.checks.map((check) => check.target));
  return found;
}

function textRefs(step) {
  return [step.value, ...targets(step).map((target) => (typeof target === "string" ? undefined : target.text))].filter(Boolean);
}

const code = SOURCE_DIRS.flatMap((dir) =>
  readdirSync(new URL(`../${dir}/`, import.meta.url), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => readFileSync(`${entry.parentPath}/${entry.name}`, "utf8")),
).join("\n");

function markerExists(attribute, id) {
  if (code.includes(`${attribute}="${id}"`)) return true;
  const dash = id.indexOf("-");
  return dash > 0 && code.includes(`${attribute}={\`${id.slice(0, dash)}-`);
}

test("every lesson has the same message keys in English and French, without forbidden characters", () => {
  for (const lesson of LESSONS) {
    const [english, french] = LOCALES.map((locale) => new Set(keys(load(locale, lesson.id))));
    assert.deepEqual([...english].filter((key) => !french.has(key)), [], `${lesson.id}: missing in French`);
    assert.deepEqual([...french].filter((key) => !english.has(key)), [], `${lesson.id}: missing in English`);
    for (const locale of LOCALES) {
      const text = readFileSync(lessonFile(locale, lesson.id), "utf8");
      for (const forbidden of FORBIDDEN) assert.equal(text.includes(forbidden), false, `${locale}/${lesson.id} has ${JSON.stringify(forbidden)}`);
    }
  }
});

test("no lesson message file is left without a lesson", () => {
  const ids = new Set(LESSONS.map((lesson) => lesson.id));
  for (const locale of LOCALES) {
    for (const file of readdirSync(new URL(`../messages/lessons/${locale}/`, import.meta.url))) {
      assert.ok(ids.has(file.replace(/\.json$/, "")), `${locale}/${file} has no lesson`);
    }
  }
});

test("every caption, chapter, check and demo value a lesson uses exists in each language", () => {
  for (const locale of LOCALES) {
    for (const lesson of LESSONS) {
      const text = load(locale, lesson.id);
      assert.ok(text.title && text.description, `${locale}: ${lesson.id} title or description`);
      assert.ok(Array.isArray(text.outcomes) && text.outcomes.length > 0, `${locale}: ${lesson.id} outcomes`);
      assert.ok(Array.isArray(text.recap) && text.recap.length > 0, `${locale}: ${lesson.id} recap`);
      for (const step of allSteps(lesson.steps)) {
        if (step.say) assert.ok(text.steps?.[step.say], `${locale}: ${lesson.id}.steps.${step.say}`);
        if (step.kind === "chapter") assert.ok(text.chapters?.[step.chapter], `${locale}: ${lesson.id}.chapters.${step.chapter}`);
        if (step.kind === "task") {
          for (const check of step.checks) assert.ok(text.checks?.[check.label], `${locale}: ${lesson.id}.checks.${check.label}`);
        }
        for (const ref of textRefs(step)) {
          if (ref.demo) assert.ok(text.demo?.[ref.demo], `${locale}: ${lesson.id}.demo.${ref.demo}`);
        }
      }
    }
  }
});

test("every element a lesson targets is marked in the code", () => {
  for (const lesson of LESSONS) {
    for (const step of allSteps(lesson.steps)) {
      for (const target of targets(step)) {
        const selector = typeof target === "string" ? target : target.selector;
        for (const [, attribute, id] of selector.matchAll(/\[(data-[a-z]+)="([^"]+)"\]/g)) {
          assert.ok(markerExists(attribute, id), `${lesson.id}: nothing has ${attribute}="${id}"`);
        }
      }
    }
  }
});

test("every Learn more link points at a docs page that exists", () => {
  for (const lesson of LESSONS) {
    for (const step of allSteps(lesson.steps)) {
      if (!step.learn) continue;
      assert.ok(existsSync(new URL(`../../docs/source/${step.learn}.md`, import.meta.url)), `${lesson.id}: ${step.learn}`);
    }
  }
});

test("lesson ids are unique and every lesson takes at least a minute", () => {
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
  for (const lesson of LESSONS) assert.ok(lessonMinutes(lesson) >= 1);
});
