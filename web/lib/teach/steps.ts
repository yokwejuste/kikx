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

export const cmd = (...parts: (string | TextRef)[]): TextRef => ({
  join: parts.map((part) => (typeof part === "string" ? lit(part) : part)),
});

export function textOf(ref: TextRef, demoText: (key: string) => string, projectNameText: () => string): string {
  if ("literal" in ref) return ref.literal;
  if ("demo" in ref) return demoText(ref.demo);
  if ("join" in ref) return ref.join.map((part) => textOf(part, demoText, projectNameText)).join(" ");
  return projectNameText();
}

export const previewLine = (text: TextRef): Target => withText(teachTarget("preview", "[data-line]"), text);
export const cliLine = (text: TextRef): Target => withText(teachTarget("cli-last", teachTarget("cli-line")), text);
export const cliFile = (text: TextRef): Target => withText(teachTarget("cli-file"), text);
export const viewerLine = (text: TextRef): Target => withText(teachTarget("cli-viewer", "[data-line]"), text);

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
export const key = (name: string): LessonStep => ({ kind: "key", key: name });
export const run = (command: TextRef, options: Narration = {}): LessonStep => ({ kind: "run", command, ...options });
export const exportPreset = (preset: TextRef, options: Narration = {}): LessonStep => ({ kind: "export", preset, ...options });

export const typed = (command: TextRef): { command: TextRef } => ({ command });

export const task = (
  key: string,
  options: { checks: Record<string, Target | { command: TextRef }>; show: LessonStep[]; learn?: string },
): LessonStep => ({
  kind: "task",
  say: key,
  checks: Object.entries(options.checks).map(([label, check]): TaskCheck =>
    typeof check === "object" && "command" in check ? { label, command: check.command } : { label, target: check },
  ),
  show: options.show,
  learn: options.learn,
});
