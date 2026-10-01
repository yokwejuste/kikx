import type { LessonStep, Target, TaskCheck, TextRef } from "./types.ts";

interface Narration {
  say?: string;
  learn?: string;
}

export const teachTarget = (id: string, inner?: string) => `[data-teach="${id}"]${inner ? ` ${inner}` : ""}`;

export const lit = (literal: string): TextRef => ({ literal });
export const demo = (key: string): TextRef => ({ demo: key });
export const projectName: TextRef = { projectName: true };
export const withText = (selector: string, text: TextRef): Target => ({ selector, text });

export const previewLine = (text: TextRef): Target => withText(teachTarget("preview", "[data-line]"), text);

export const chapter = (key: string): LessonStep => ({ kind: "chapter", chapter: key });
export const go = (path: string): LessonStep => ({ kind: "go", path });
export const say = (key: string, options: { learn?: string } = {}): LessonStep => ({ kind: "say", say: key, ...options });
export const point = (target: Target, key: string, options: { learn?: string } = {}): LessonStep => ({
  kind: "point",
  target,
  say: key,
  ...options,
});
export const click = (target: Target, options: Narration & { optional?: boolean } = {}): LessonStep => ({
  kind: "click",
  target,
  ...options,
});
export const type = (
  target: Target,
  value: TextRef,
  options: Narration & { enter?: boolean; instant?: boolean } = {},
): LessonStep => ({ kind: "type", target, value, ...options });
export const choose = (target: Target, value: TextRef, options: Narration = {}): LessonStep => ({
  kind: "choose",
  target,
  value,
  ...options,
});
export const key = (name: string): LessonStep => ({ kind: "key", key: name });
export const task = (
  key: string,
  options: { checks: Record<string, Target>; show: LessonStep[]; learn?: string },
): LessonStep => ({
  kind: "task",
  say: key,
  checks: Object.entries(options.checks).map(([label, target]): TaskCheck => ({ label, target })),
  show: options.show,
  learn: options.learn,
});
