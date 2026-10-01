import type { Lesson } from "../types.ts";
import { firstProject } from "./first-project.ts";
import { template } from "./template.ts";
import { importExisting } from "./import-existing.ts";
import { playbooks } from "./playbooks.ts";
import { checks } from "./checks.ts";
import { kubernetes } from "./kubernetes.ts";
import { terraform } from "./terraform.ts";

export const LESSONS: Lesson[] = [firstProject, template, importExisting, playbooks, checks, kubernetes, terraform];

const SECONDS_PER_STEP = 5;
const SECONDS_PER_TASK = 25;

export function lessonMinutes(lesson: Lesson): number {
  const seconds = lesson.steps.reduce((total, step) => total + (step.kind === "task" ? SECONDS_PER_TASK : SECONDS_PER_STEP), 0);
  return Math.max(1, Math.round(seconds / 60));
}

export function nextLesson(id: string): Lesson | null {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index >= 0 ? (LESSONS[index + 1] ?? null) : null;
}
