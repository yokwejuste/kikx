import type { Lesson } from "../types.ts";
import { chapter, click, demo, go, key, point, previewLine, say, task, teachTarget, type, withText } from "../steps.ts";

const card = withText(teachTarget("template"), demo("template"));
const panel = '[data-tour="project"]';
const row = (name: string) => withText(teachTarget("component-row"), demo(name));
const node = (name: string) => withText(teachTarget("diagram-node"), demo(name));
const opened = (name: string) => withText(teachTarget("editor-title"), demo(name));
const timezone = '[data-tour="editor"] input[name="timezone"]';

export const template: Lesson = {
  id: "template",
  mode: "app",
  level: "basics",
  icon: "template",
  steps: [
    chapter("choose"),
    go("/"),
    say("intro"),
    point('[data-tour="templates"]', "gallery", { learn: "how-to/presets" }),
    point(card, "card"),
    point(card, "count"),
    click(card, { say: "open" }),
    chapter("project"),
    click(teachTarget("project-drawer"), { optional: true }),
    point(panel, "panel", { learn: "explanation/project-layout" }),
    point(teachTarget("component-row"), "provision"),
    click(teachTarget("component-files"), { say: "files" }),
    click(teachTarget("component-file"), { say: "viewFile" }),
    point('[role="dialog"]', "fileDialog"),
    key("Escape"),
    point(row("groupVars"), "inventoryStage"),
    point(row("playbook"), "configureStage"),
    task("openGroupVars", {
      checks: { groupVarsOpen: opened("groupVars") },
      show: [click(teachTarget("project-drawer"), { optional: true }), click(row("groupVars"))],
    }),
    point(teachTarget("key-values"), "groupVarsForm", { learn: "how-to/group-vars" }),
    chapter("architecture"),
    click(teachTarget("tab-diagram"), { say: "diagram", learn: "explanation/architecture-diagram" }),
    say("lanes"),
    point(node("playbook"), "edges"),
    click(node("playbook"), { say: "nodeClick" }),
    point(opened("playbook"), "playbookOpen"),
    click(teachTarget("tab-diagram"), { say: "backToDiagram" }),
    task("openRole", {
      checks: { roleOpen: opened("role") },
      show: [click(node("role"))],
    }),
    chapter("edit"),
    point(timezone, "timezone", { learn: "explanation/rendering" }),
    point(previewLine(demo("current")), "currentLine"),
    task("changeTimezone", {
      checks: { typed: withText(timezone, demo("timezone")), previewed: previewLine(demo("timezone")) },
      show: [type(timezone, demo("timezone"))],
    }),
    point(previewLine(demo("timezone")), "changedLine"),
    click(teachTarget("save"), { say: "save" }),
    chapter("review"),
    click(teachTarget("tab-checks"), { say: "checks", learn: "reference/checks" }),
    say("checksWhy"),
    click('[data-tour="download"]', { say: "export" }),
    point('[role="menu"]', "exportOptions", { learn: "how-to/presets" }),
    key("Escape"),
    say("done"),
  ],
};
