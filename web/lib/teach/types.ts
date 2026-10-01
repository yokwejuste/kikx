export type TextRef = { literal: string } | { demo: string } | { projectName: true } | { join: TextRef[] };

export type Target = string | { selector: string; text: TextRef };

interface StepNarration {
  say?: string;
  learn?: string;
}

export type TaskCheck = { label: string; target: Target } | { label: string; command: TextRef };

export type LessonStep =
  | { kind: "chapter"; chapter: string }
  | { kind: "go"; path: string }
  | ({ kind: "say"; say: string } & StepNarration)
  | ({ kind: "point"; target: Target; say: string } & StepNarration)
  | ({ kind: "click"; target: Target; optional?: boolean } & StepNarration)
  | ({ kind: "type"; target: Target; value: TextRef; enter?: boolean; instant?: boolean } & StepNarration)
  | ({ kind: "choose"; target: Target; value: TextRef } & StepNarration)
  | { kind: "key"; key: string }
  | ({ kind: "run"; command: TextRef } & StepNarration)
  | ({ kind: "export"; preset: TextRef } & StepNarration)
  | ({ kind: "task"; say: string; checks: TaskCheck[]; show: LessonStep[] } & StepNarration);

export type LessonLevel = "basics" | "further";

export type TeachMode = "app" | "cli";

export const TEACH_MODES: TeachMode[] = ["app", "cli"];

export type LessonIcon =
  | "sparkles"
  | "template"
  | "playbook"
  | "checks"
  | "kubernetes"
  | "cloud"
  | "import"
  | "terminal"
  | "sync"
  | "upgrade";

export interface Lesson {
  id: string;
  mode: TeachMode;
  level: LessonLevel;
  icon: LessonIcon;
  steps: LessonStep[];
}
