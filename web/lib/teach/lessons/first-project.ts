import type { Lesson } from "../types.ts";
import {
  chapter,
  click,
  demo,
  go,
  key,
  lit,
  point,
  previewLine,
  projectName,
  say,
  task,
  teachTarget,
  type,
  withText,
} from "../steps.ts";

const editor = '[data-tour="editor"]';
const nameField = `${editor} input[name="name"]`;
const hostField = (index: number, field: string) => `${editor} input[name="hosts.${index}.${field}"]`;
const secondHostGroups = `${teachTarget("host-row")}:nth-of-type(2) [role="combobox"]`;
const playField = (field: string) => `${editor} input[name="plays.0.${field}"]`;
const scaffold = teachTarget("issue-scaffold");

export const firstProject: Lesson = {
  id: "firstProject",
  level: "basics",
  icon: "sparkles",
  steps: [
    chapter("start"),
    go("/"),
    say("intro"),
    type(teachTarget("new-project-form", "input"), projectName, { say: "name" }),
    click(teachTarget("new-project-form", 'button[type="submit"]'), { say: "start" }),
    point(teachTarget("start-panel"), "path"),

    chapter("inventory"),
    click(teachTarget("start-inventory"), { say: "inventory", learn: "how-to/import-an-inventory" }),
    point(nameField, "inventoryName"),
    type(teachTarget("host-name"), demo("host"), { say: "hostName" }),
    type(teachTarget("host-address"), demo("address"), { say: "hostAddress" }),
    type(teachTarget("host-row", '[role="combobox"]'), demo("group"), { say: "hostGroup", enter: true }),
    point(previewLine(lit("[web]")), "previewGroup"),
    task("addHost", {
      checks: {
        dbName: withText(hostField(1, "name"), demo("dbHost")),
        dbAddress: withText(hostField(1, "ansibleHost"), demo("dbAddress")),
        dbGroup: previewLine(lit("[db]")),
      },
      show: [
        click(teachTarget("add-host")),
        type(hostField(1, "name"), demo("dbHost")),
        type(hostField(1, "ansibleHost"), demo("dbAddress")),
        type(secondHostGroups, demo("dbGroup"), { enter: true }),
      ],
    }),
    point(previewLine(lit("[db]")), "previewDb"),
    click(teachTarget("save"), { say: "addInventory" }),

    chapter("groupVars"),
    click(teachTarget("catalog-groupvars", "button"), { say: "groupVars", learn: "how-to/group-vars" }),
    type(teachTarget("groupvars-group", "input"), demo("group"), { say: "groupName" }),
    type(teachTarget("key-values", "input:nth-of-type(1)"), demo("varKey"), { say: "varKey" }),
    type(teachTarget("key-values", "input:nth-of-type(2)"), demo("varValue")),
    point(previewLine(demo("varKey")), "varLine"),
    say("varsWhy"),
    click(teachTarget("save"), { say: "addVars" }),

    chapter("playbook"),
    click(`${teachTarget("stage-configure")}[aria-expanded="false"]`, { optional: true }),
    click(teachTarget("catalog-playbook", "button"), { say: "playbook", learn: "how-to/multi-play-playbooks" }),
    type(nameField, demo("playbook"), { say: "playbookName" }),
    point(teachTarget("play-card"), "play"),
    type(playField("name"), demo("playName"), { say: "playName" }),
    task("targetWeb", {
      checks: {
        playHosts: withText(playField("hosts"), demo("group")),
        playRole: previewLine(demo("role")),
      },
      show: [
        type(playField("hosts"), demo("group")),
        type(teachTarget("play-card", '[role="combobox"]'), demo("role"), { enter: true }),
      ],
    }),
    point(previewLine(demo("role")), "roleLine"),
    click(teachTarget("save"), { say: "addPlaybook" }),

    chapter("checks"),
    point(scaffold, "rolesMissing", { learn: "explanation/vendoring" }),
    click(teachTarget("tab-checks"), { say: "checksTab", learn: "reference/checks" }),
    point(scaffold, "checksNote"),
    click(teachTarget("tab-build"), { say: "backToBuild" }),
    task("scaffold", {
      learn: "how-to/scaffold-roles",
      checks: { scaffolded: teachTarget("catalog-role", teachTarget("catalog-count")) },
      show: [click(scaffold)],
    }),
    point(teachTarget("catalog-role"), "scaffoldWhy"),

    chapter("site"),
    click(teachTarget("catalog-site", "button"), { say: "site", learn: "how-to/site-playbook" }),
    type(nameField, demo("site"), { say: "siteName" }),
    click(withText(`${editor} form button`, demo("playbook")), { say: "siteImport" }),
    point(previewLine(lit("import_playbook")), "importLine"),
    click(teachTarget("save"), { say: "addSite" }),

    chapter("review"),
    click(teachTarget("tab-diagram"), { say: "diagram", learn: "explanation/architecture-diagram" }),
    say("diagramRead"),
    click('[data-tour="download"]', { say: "export", learn: "how-to/presets" }),
    point('[role="menu"]', "exportOptions"),
    key("Escape"),
    click(teachTarget("tab-build")),
    say("done"),
  ],
};
