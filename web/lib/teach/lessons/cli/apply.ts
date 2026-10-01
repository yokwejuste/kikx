import type { Lesson } from "../../types.ts";
import {
  chapter,
  click,
  cliFile,
  cliLine,
  cmd,
  demo,
  exportPreset,
  go,
  key,
  lit,
  point,
  run,
  say,
  task,
  teachTarget,
  typed,
  viewerLine,
  withText,
} from "../../steps.ts";
import { CONFIG_FILE } from "../../cli/engine.ts";

const card = withText(teachTarget("template"), demo("template"));
const apply = cmd("kikx apply", demo("presetPath"), "--into", demo("outputDir"));
const applyStaging = cmd("kikx apply", demo("presetPath"), "--into", demo("staging"));

export const cliApply: Lesson = {
  id: "cliApply",
  mode: "cli",
  level: "further",
  icon: "sync",
  steps: [
    chapter("export"),
    go("/"),
    say("intro"),
    click(teachTarget("mode-app"), { say: "appTab" }),
    click(card, { say: "open" }),
    click('[data-tour="download"]', { say: "export", learn: "how-to/presets" }),
    point('[role="menu"]', "presetOption"),
    key("Escape"),
    go("/learn/cli"),
    exportPreset(demo("template"), { say: "exported" }),
    point(cliFile(demo("presetFile")), "presetFile", { learn: "reference/preset-format" }),
    point(viewerLine(lit("components")), "presetJson"),
    point(viewerLine(lit("reference")), "presetComponent"),

    chapter("apply"),
    run(cmd("kikx init --name", demo("project")), { say: "init" }),
    task("apply", {
      learn: "reference/cli",
      checks: { applied: typed(apply) },
      show: [run(apply)],
    }),
    point(cliLine(lit("Vendored")), "vendored"),
    point(teachTarget("cli-files"), "applied"),
    click(cliFile(lit(CONFIG_FILE)), { say: "tomlKept" }),
    point(viewerLine(lit("name =")), "tomlName"),

    chapter("versus"),
    run(cmd("kikx setup", demo("presetPath")), { say: "setupTry" }),
    point(cliLine(lit("already exists")), "setupRefused"),
    say("versus"),

    chapter("rerun"),
    run(apply, { say: "rerun" }),
    point(cliLine(lit("already exists")), "nothingWritten"),
    say("force"),
    task("staging", {
      checks: { staged: typed(applyStaging) },
      show: [run(applyStaging)],
    }),
    point(cliFile(demo("staging")), "stagingFolder"),
    run(cmd("ls", demo("staging")), { say: "lsStaging" }),
    say("diff"),
    say("done"),
  ],
};
