import type { Lesson } from "../types.ts";
import { chapter, click, demo, go, lit, point, previewLine, projectName, say, task, teachTarget, type, withText } from "../steps.ts";

const play = (number: number, inner: string) => `${teachTarget("play-card")}:nth-child(${number}) ${inner}`;
const playName = (number: number) => play(number, "input");
const playHosts = (number: number) => play(number, "input[list]");
const playRoles = (number: number) => play(number, '[role="combobox"]');
const playTags = (number: number) => play(number, 'div:has(> label > input[type="checkbox"]) [role="combobox"]');
const playChip = (number: number, role: string) => withText(play(number, "span"), demo(role));
const catalogEntry = (kind: string) => teachTarget(`catalog-${kind}`, "button");

export const playbooks: Lesson = {
  id: "playbooks",
  level: "further",
  icon: "playbook",
  steps: [
    chapter("setup"),
    go("/"),
    say("intro"),
    type(teachTarget("new-project-form", "input"), projectName),
    click(teachTarget("new-project-form", 'button[type="submit"]')),
    click(teachTarget("start-inventory"), { say: "inventory", learn: "how-to/import-an-inventory" }),
    type(teachTarget("field-name"), demo("inventoryName"), { say: "inventoryName" }),
    click(teachTarget("inventory-import"), { say: "import" }),
    type(teachTarget("inventory-ini"), demo("inventory"), { say: "paste", instant: true }),
    click(teachTarget("inventory-replace"), { say: "apply" }),
    click(teachTarget("save"), { say: "saveInventory" }),

    chapter("plays"),
    click(teachTarget("stage-configure"), { say: "configure", learn: "how-to/multi-play-playbooks" }),
    click(catalogEntry("playbook")),
    type(teachTarget("field-name"), demo("playbook"), { say: "playbookName" }),
    type(teachTarget("field-folder"), demo("folder"), { say: "folder" }),
    point(teachTarget("play-card"), "play"),
    type(playName(1), demo("basePlay"), { say: "playName" }),
    type(playHosts(1), lit("all"), { say: "allHosts" }),
    type(playRoles(1), demo("commonRole"), { say: "commonRole", enter: true }),
    type(playTags(1), demo("baseTag"), { say: "tags", enter: true }),
    click(teachTarget("add-play"), { say: "addPlay" }),
    type(playName(2), demo("webPlay")),
    type(playHosts(2), demo("webGroup"), { say: "webHosts" }),
    type(playRoles(2), demo("nginxRole"), { say: "nginx", enter: true }),
    task("yourRole", {
      checks: { certbot: playChip(2, "certbotRole") },
      show: [type(playRoles(2), demo("certbotRole"), { enter: true })],
    }),
    say("roleOrder"),
    click(play(2, "details:first-of-type > summary"), { say: "conditions" }),
    type(play(2, "details[open] label:last-of-type input"), demo("tlsCondition"), { say: "when" }),
    task("yourPlay", {
      checks: {
        name: withText(playName(3), demo("dbPlay")),
        hosts: withText(playHosts(3), demo("dbGroup")),
        role: playChip(3, "dbRole"),
      },
      show: [
        click(teachTarget("add-play")),
        type(playName(3), demo("dbPlay")),
        type(playHosts(3), demo("dbGroup")),
        type(playRoles(3), demo("dbRole"), { enter: true }),
      ],
    }),
    say("runOrder"),
    point(previewLine(lit("when:")), "whenPreview"),
    point(previewLine(demo("webHostsLine")), "targeting"),
    click(teachTarget("save"), { say: "savePlaybook" }),

    chapter("roles"),
    click(catalogEntry("role"), { say: "role", learn: "how-to/scaffold-roles" }),
    type(teachTarget("field-name"), demo("nginxRole"), { say: "roleName" }),
    point(teachTarget("preview"), "skeleton"),
    click(teachTarget("save")),
    click(teachTarget("more-configure"), { say: "more" }),
    click(catalogEntry("commonrole")),
    type(teachTarget("field-name"), demo("commonRole"), { say: "commonName" }),
    point(teachTarget("field-timezone"), "commonPreview"),
    say("difference"),
    click(teachTarget("save")),

    chapter("wire"),
    click(catalogEntry("ansiblecfg"), { say: "cfg", learn: "how-to/site-playbook" }),
    type(teachTarget("field-inventory"), demo("inventoryFile"), { say: "cfgInventory" }),
    point(teachTarget("field-rolesPath"), "rolesPath"),
    point(previewLine(lit("roles_path")), "cfgPreview"),
    click(teachTarget("save")),
    click(catalogEntry("site"), { say: "site" }),
    type(teachTarget("field-name"), demo("site"), { say: "siteName" }),
    click(withText('[data-tour="editor"] button', demo("playbookPath")), { say: "siteImport" }),
    point(previewLine(lit("import_playbook")), "importLine"),
    click(teachTarget("save")),
    click(teachTarget("tab-checks"), { say: "checks" }),
    say("done"),
  ],
};
