import type { Lesson, TeachMode } from "../types.ts";
import { firstProject } from "./first-project.ts";
import { template } from "./template.ts";
import { importExisting } from "./import-existing.ts";
import { playbooks } from "./playbooks.ts";
import { checks } from "./checks.ts";
import { kubernetes } from "./kubernetes.ts";
import { terraform } from "./terraform.ts";
import { cliInstall } from "./cli/install.ts";
import { cliTemplate } from "./cli/template.ts";
import { cliApply } from "./cli/apply.ts";
import { cliUpgrade } from "./cli/upgrade.ts";

export const LESSONS: Lesson[] = [
  firstProject,
  template,
  importExisting,
  playbooks,
  checks,
  kubernetes,
  terraform,
  cliInstall,
  cliTemplate,
  cliApply,
  cliUpgrade,
];

const SECONDS_PER_STEP = 5;
const SECONDS_PER_RUN = 9;
const SECONDS_PER_TASK = 25;

const STEP_SECONDS: Partial<Record<Lesson["steps"][number]["kind"], number>> = {
  run: SECONDS_PER_RUN,
  task: SECONDS_PER_TASK,
};

export function lessonMinutes(lesson: Lesson): number {
  const seconds = lesson.steps.reduce((total, step) => total + (STEP_SECONDS[step.kind] ?? SECONDS_PER_STEP), 0);
  return Math.max(1, Math.round(seconds / 60));
}

export const lessonsFor = (mode: TeachMode): Lesson[] => LESSONS.filter((lesson) => lesson.mode === mode);

export function nextLesson(id: string): Lesson | null {
  const lesson = LESSONS.find((candidate) => candidate.id === id);
  if (!lesson) return null;
  const sameMode = lessonsFor(lesson.mode);
  return sameMode[sameMode.indexOf(lesson) + 1] ?? null;
}
