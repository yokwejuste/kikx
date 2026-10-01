import type { Lesson, LessonStep } from "../types.ts";
import { chapter, click, demo, go, lit, point, previewLine, projectName, say, task, teachTarget, type, withText } from "../steps.ts";

const editorInput = (name: string) => `[data-tour="editor"] input[name="${name}"]`;
const openStage = (stage: string) => click(`nav button[aria-expanded="false"][aria-controls$="-${stage}"]`, { optional: true });
const row = (name: string) => withText(teachTarget("component-row"), demo(name));
const diagramNode = (text: string) => withText(".react-flow__node", demo(text));

const chooseProvider = (provider: string, options: { say?: string; list?: string } = {}): LessonStep[] => [
  click('[data-tour="editor"] button[role="combobox"]', { say: options.say }),
  click('[role="listbox"]', { say: options.list }),
  click(withText('[role="option"]', demo(provider))),
];

const secondServer: LessonStep[] = [
  openStage("provision"),
  click(teachTarget("catalog-server", "button")),
  type(editorInput("name"), demo("second")),
  ...chooseProvider("secondProvider"),
  type(editorInput("fields.region"), demo("secondRegion")),
  type(editorInput("fields.size"), demo("secondSize")),
  click(teachTarget("save")),
];

const inventory: LessonStep[] = [
  openStage("inventory"),
  click(teachTarget("catalog-inventory", "button")),
  type(editorInput("name"), demo("inventory")),
  type(teachTarget("host-name"), demo("host")),
  type(teachTarget("host-address"), demo("address")),
  type(teachTarget("host-row", '[role="combobox"]'), demo("group"), { enter: true }),
  click(teachTarget("save")),
];

export const terraform: Lesson = {
  id: "terraform",
  mode: "app",
  level: "further",
  icon: "cloud",
  steps: [
    chapter("start"),
    go("/"),
    say("intro"),
    say("why"),
    type(teachTarget("new-project-form", "input"), projectName, { say: "name" }),
    click(teachTarget("new-project-form", 'button[type="submit"]'), { say: "start" }),
    point(teachTarget("start-provision"), "optional"),
    click(teachTarget("start-provision"), { say: "addServer", learn: "reference/components" }),

    chapter("server"),
    type(editorInput("name"), demo("server"), { say: "serverName" }),
    ...chooseProvider("provider", { say: "provider", list: "providerList" }),
    point(withText('[data-tour="editor"] button[role="combobox"]', demo("provider")), "providerFields"),
    type(editorInput("fields.region"), demo("region"), { say: "region" }),
    type(editorInput("fields.size"), demo("size"), { say: "size" }),
    point(editorInput("fields.os_image"), "image"),
    point(editorInput("fields.count"), "count"),

    chapter("file"),
    point(teachTarget("preview"), "preview"),
    point(previewLine(demo("token")), "token"),
    point(previewLine(demo("resource")), "resource"),
    point(previewLine(lit("${count.index}")), "names"),
    point(previewLine(demo("region")), "location"),
    click(teachTarget("save"), { say: "add" }),

    chapter("second"),
    say("secondWhy"),
    task("secondTask", {
      checks: { secondAdded: row("second"), secondProvider: row("secondProvider") },
      show: secondServer,
      learn: "explanation/registry",
    }),
    point(row("second"), "rows"),

    chapter("inventory"),
    say("handover"),
    say("addresses"),
    task("inventoryTask", {
      checks: { inventoryAdded: row("inventory"), hostListed: withText(teachTarget("host-name"), demo("host")) },
      show: inventory,
      learn: "how-to/import-an-inventory",
    }),
    click(teachTarget("tab-diagram"), { say: "diagram", learn: "explanation/architecture-diagram" }),
    point(diagramNode("region"), "serverNode"),
    point(".react-flow__edgelabel-renderer > div", "edge"),
    point('.react-flow__node[data-id^="ansible/inventory:"]', "groupNode"),
    point(diagramNode("second"), "fallback"),
    click(teachTarget("tab-build"), { say: "build" }),
    say("done"),
  ],
};
