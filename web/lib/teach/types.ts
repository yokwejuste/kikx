export type TextRef = { literal: string } | { demo: string } | { projectName: true };

export type Target = string | { selector: string; text: TextRef };

export interface StepNarration {
  say?: string;
  learn?: string;
}

export interface TaskCheck {
  label: string;
  target: Target;
}

export type LessonStep =
  | { kind: "chapter"; chapter: string }
  | { kind: "go"; path: string }
  | ({ kind: "say"; say: string } & StepNarration)
  | ({ kind: "point"; target: Target; say: string } & StepNarration)
  | ({ kind: "click"; target: Target; optional?: boolean } & StepNarration)
  | ({ kind: "type"; target: Target; value: TextRef; enter?: boolean; instant?: boolean } & StepNarration)
  | ({ kind: "choose"; target: Target; value: TextRef } & StepNarration)
  | { kind: "key"; key: string }
  | ({ kind: "task"; say: string; checks: TaskCheck[]; show: LessonStep[] } & StepNarration);

export type LessonLevel = "basics" | "further";

export type LessonIcon = "sparkles" | "template" | "playbook" | "checks" | "kubernetes" | "cloud" | "import";

export interface Lesson {
  id: string;
  level: LessonLevel;
  icon: LessonIcon;
  steps: LessonStep[];
}
