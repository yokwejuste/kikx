import type { Lesson } from "../../types.ts";
import { chapter, click, cliFile, cliLine, cmd, demo, go, lit, point, run, say, task, teachTarget, typed, viewerLine } from "../../steps.ts";
import { CONFIG_FILE } from "../../cli/engine.ts";

const setup = cmd("kikx setup", demo("template"));
const retime = cmd("kikx add", demo("roleComponent"), "--name", demo("roleName"), "--set", demo("timezoneSet"), "--force");

export const cliTemplate: Lesson = {
  id: "cliTemplate",
  mode: "cli",
  level: "basics",
  icon: "template",
  steps: [
    chapter("presets"),
    go("/learn/cli"),
    say("intro"),
    run(lit("kikx presets"), { say: "presets", learn: "how-to/presets" }),
    point(cliLine(demo("template")), "templateLine"),
    say("pick"),

    chapter("setup"),
    task("setup", {
      learn: "reference/preset-format",
      checks: { setup: typed(setup) },
      show: [run(setup)],
    }),
    point(cliLine(lit("Initialized")), "initialized"),
    point(teachTarget("cli-files"), "tree", { learn: "explanation/project-layout" }),
    click(cliFile(lit(CONFIG_FILE)), { say: "openToml" }),
    point(viewerLine(lit("name =")), "tomlName"),

    chapter("files"),
    click(cliFile(demo("terraformFile")), { say: "openTerraform" }),
    point(viewerLine(demo("region")), "regionLine"),
    click(cliFile(demo("inventoryFile")), { say: "openInventory" }),
    point(viewerLine(demo("host")), "inventoryLine"),
    click(cliFile(demo("groupVarsFile")), { say: "openGroupVars" }),
    point(viewerLine(demo("groupVar")), "groupVarLine"),
    click(cliFile(demo("playbookFile")), { say: "openPlaybook" }),
    point(viewerLine(demo("roleName")), "playbookLine"),
    click(cliFile(demo("siteFile")), { say: "openSite" }),
    point(viewerLine(demo("siteLine")), "siteLine"),
    run(cmd("ls", demo("outputDir")), { say: "ls" }),
    run(cmd("cat", demo("configFile")), { say: "cat" }),

    chapter("own"),
    say("own", { learn: "explanation/vendoring" }),
    say("editing"),
    task("retime", {
      checks: { retimed: typed(retime) },
      show: [run(retime)],
    }),
    point(cliLine(lit("Vendored")), "overwritten"),
    point(viewerLine(demo("timezone")), "timezoneLine"),
    say("force"),
    say("done"),
  ],
};
