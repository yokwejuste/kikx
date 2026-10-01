export type DemoValue = "projectName" | "host" | "address" | "group" | "varKey" | "varValue";

export type LessonStep =
  | { kind: "go"; path: string }
  | { kind: "say"; say: string }
  | { kind: "point"; target: string; say: string }
  | { kind: "click"; target: string; say?: string; optional?: boolean }
  | { kind: "type"; target: string; value: DemoValue; say?: string; enter?: boolean }
  | { kind: "key"; key: string };

export interface Lesson {
  id: string;
  steps: LessonStep[];
}

export const teachTarget = (id: string, inner?: string) => `[data-teach="${id}"]${inner ? ` ${inner}` : ""}`;

const go = (path: string): LessonStep => ({ kind: "go", path });
const say = (key: string): LessonStep => ({ kind: "say", say: key });
const point = (target: string, key: string): LessonStep => ({ kind: "point", target, say: key });
const click = (target: string, key?: string, optional = false): LessonStep => ({ kind: "click", target, say: key, optional });
const type = (target: string, value: DemoValue, key?: string, enter = false): LessonStep => ({
  kind: "type",
  target,
  value,
  say: key,
  enter,
});
const key = (name: string): LessonStep => ({ kind: "key", key: name });

const EXPORT_TRIGGER = '[data-tour="download"]';

const tourOfViews = [
  click(teachTarget("tab-checks"), "checks"),
  click(teachTarget("tab-diagram"), "diagram"),
  click(teachTarget("tab-build"), "build"),
  click(EXPORT_TRIGGER, "export"),
  key("Escape"),
  say("done"),
];

export const LESSONS: Lesson[] = [
  {
    id: "firstProject",
    steps: [
      go("/"),
      say("intro"),
      type(teachTarget("new-project-form", "input"), "projectName", "name"),
      click(teachTarget("new-project-form", 'button[type="submit"]'), "start"),
      point(teachTarget("start-panel"), "path"),
      click(teachTarget("start-inventory"), "inventory"),
      type(teachTarget("host-name"), "host", "hostName"),
      type(teachTarget("host-address"), "address", "hostAddress"),
      type(teachTarget("host-row", '[role="combobox"]'), "group", "hostGroup", true),
      point(teachTarget("preview"), "preview"),
      click(teachTarget("save"), "add"),
      click(teachTarget("catalog-groupvars", "button"), "groupVars"),
      type(teachTarget("groupvars-group", "input"), "group", "groupName"),
      type(teachTarget("key-values", "input:nth-of-type(1)"), "varKey", "varKey"),
      type(teachTarget("key-values", "input:nth-of-type(2)"), "varValue"),
      click(teachTarget("save"), "addVars"),
      point('[data-tour="checklist"]', "checklist"),
      ...tourOfViews,
    ],
  },
  {
    id: "template",
    steps: [
      go("/"),
      say("intro"),
      click(teachTarget("template"), "open"),
      point('[data-tour="project"]', "project"),
      click(teachTarget("project-drawer"), undefined, true),
      click(teachTarget("component-row"), "edit"),
      point(teachTarget("preview"), "preview"),
      ...tourOfViews,
    ],
  },
];

const SECONDS_PER_STEP = 5;

export function lessonMinutes(lesson: Lesson): number {
  return Math.max(1, Math.round((lesson.steps.length * SECONDS_PER_STEP) / 60));
}

export function lessonSayKeys(lesson: Lesson): string[] {
  return lesson.steps.flatMap((step) => ("say" in step && step.say ? [step.say] : []));
}

export function lessonTargets(lesson: Lesson): string[] {
  return lesson.steps.flatMap((step) => ("target" in step ? [step.target] : []));
}
