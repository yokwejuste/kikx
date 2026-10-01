import type { Lesson } from "../types.ts";
import { chapter, click, go, key, point, say, teachTarget } from "../steps.ts";

export const template: Lesson = {
  id: "template",
  level: "basics",
  icon: "template",
  steps: [
    chapter("open"),
    go("/"),
    say("intro"),
    click(teachTarget("template"), { say: "open" }),
    point('[data-tour="project"]', "project"),
    click(teachTarget("project-drawer"), { optional: true }),
    click(teachTarget("component-row"), { say: "edit" }),
    point(teachTarget("preview"), "preview"),
    chapter("review"),
    click(teachTarget("tab-checks"), { say: "checks" }),
    click(teachTarget("tab-diagram"), { say: "diagram" }),
    click(teachTarget("tab-build"), { say: "build" }),
    click('[data-tour="download"]', { say: "export" }),
    key("Escape"),
    say("done"),
  ],
};
