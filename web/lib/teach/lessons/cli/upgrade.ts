import type { Lesson } from "../../types.ts";
import { chapter, click, cliFile, cliLine, cmd, demo, go, lit, point, run, say, task, teachTarget, typed } from "../../steps.ts";
import { CONFIG_FILE } from "../../cli/engine.ts";

const last = teachTarget("cli-last");
const check = cmd("kikx upgrade", "--check");
const upgrade = lit("kikx upgrade");

export const cliUpgrade: Lesson = {
  id: "cliUpgrade",
  mode: "cli",
  level: "further",
  icon: "upgrade",
  steps: [
    chapter("project"),
    go("/learn/cli"),
    say("intro"),
    run(cmd("kikx setup", demo("template")), { say: "setup" }),
    point(teachTarget("cli-files"), "files"),
    say("why"),

    chapter("version"),
    run(cmd("kikx", "--version"), { say: "version" }),
    point(last, "versionLine"),
    say("releases"),
    run(cmd("kikx", "--help"), { say: "help" }),
    point(cliLine(lit("upgrade")), "helpUpgrade"),

    chapter("check"),
    task("check", {
      learn: "reference/cli",
      checks: { checked: typed(check) },
      show: [run(check)],
    }),
    point(last, "checkLine"),
    say("checkWhy"),

    chapter("upgrade"),
    task("upgrade", {
      checks: { upgraded: typed(upgrade) },
      show: [run(upgrade)],
    }),
    point(last, "upgraded"),
    say("replaces"),
    run(cmd("kikx", "--version"), { say: "confirm" }),
    point(last, "confirmLine"),
    say("reinstall"),

    chapter("untouched"),
    point(teachTarget("cli-files"), "untouched", { learn: "explanation/vendoring" }),
    click(cliFile(lit(CONFIG_FILE)), { say: "tomlSame" }),
    click(cliFile(demo("siteFile")), { say: "filesSame" }),
    say("newTemplates"),
    run(upgrade, { say: "again" }),
    point(last, "latest"),
    say("pin"),
    run(cmd("kikx upgrade", "--check", "--version", demo("pinned")), { say: "pinCheck" }),
    point(last, "pinLine"),
    say("done"),
  ],
};
