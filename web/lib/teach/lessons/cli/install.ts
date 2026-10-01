import type { Lesson } from "../../types.ts";
import { chapter, cliFile, cliLine, cmd, demo, go, lit, point, run, say, task, teachTarget, typed, viewerLine } from "../../steps.ts";
import { INSTALL_COMMAND } from "../../../cli/repository.ts";
import { CONFIG_FILE } from "../../cli/engine.ts";

const addDeployment = cmd("kikx add", demo("component"), "--name", demo("name"), "--set", demo("imageSet"));
const addService = cmd("kikx add", demo("serviceComponent"), "--name", demo("name"), "--set", demo("portSet"));
const addRole = cmd("kikx add", demo("roleComponent"), "--name", demo("roleName"), "--set", demo("timezoneSet"));

export const cliInstall: Lesson = {
  id: "cliInstall",
  mode: "cli",
  level: "basics",
  icon: "terminal",
  steps: [
    chapter("install"),
    go("/learn/cli"),
    say("intro"),
    point(teachTarget("cli-terminal"), "terminal"),
    point(teachTarget("cli-files"), "files"),
    run(lit(INSTALL_COMMAND), { say: "install", learn: "tutorials/first-project-cli" }),
    point(teachTarget("cli-last"), "installNotice"),
    say("installWhat"),
    point(teachTarget("cli-last", teachTarget("cli-copy")), "copy"),

    chapter("init"),
    run(cmd("kikx init --name", demo("project")), { say: "init", learn: "reference/configuration" }),
    point(cliLine(lit("Initialized")), "initialized"),
    point(cliFile(lit(CONFIG_FILE)), "toml"),
    point(viewerLine(lit("name =")), "tomlName"),
    point(viewerLine(lit("default_namespace")), "tomlNamespace"),
    point(viewerLine(lit("output_dir")), "tomlOutput"),
    point(cliFile(demo("outputDir")), "outputDir"),

    chapter("list"),
    run(lit("kikx list"), { say: "list", learn: "reference/components" }),
    point(cliLine(demo("component")), "listItem"),
    point(cliLine(demo("imageField")), "listFields"),
    say("listOthers"),

    chapter("add"),
    run(addDeployment, { say: "add", learn: "explanation/vendoring" }),
    point(cliLine(lit("Vendored")), "vendored"),
    point(cliFile(demo("deploymentFile")), "deploymentFile"),
    point(viewerLine(demo("image")), "imageLine"),
    say("yours"),
    task("addService", {
      learn: "reference/components",
      checks: { service: typed(addService) },
      show: [run(addService)],
    }),
    point(cliFile(demo("serviceFile")), "serviceFile"),

    chapter("again"),
    run(addDeployment, { say: "rerun" }),
    point(cliLine(lit("already exists")), "refused"),
    task("addRole", {
      checks: { role: typed(addRole) },
      show: [run(addRole)],
    }),
    point(cliFile(demo("roleName")), "roleFiles"),
    point(viewerLine(demo("timezone")), "timezoneLine"),
    say("done"),
  ],
};
