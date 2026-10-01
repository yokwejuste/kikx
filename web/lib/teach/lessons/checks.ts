import type { Lesson } from "../types.ts";
import { chapter, click, demo, go, lit, point, projectName, say, task, teachTarget, type, withText } from "../steps.ts";

const editorName = '[data-tour="editor"] form input';
const playName = '[data-tour="editor"] form li input';
const playRoles = '[data-tour="editor"] form li [role="combobox"]';
const hostGroups = teachTarget("host-row", '[role="combobox"]');
const secondRow = `${teachTarget("host-row")}:nth-child(2)`;
const connection = teachTarget("host-row", "summary");
const secondRemove = `li:nth-child(2) ${teachTarget("component-remove")}`;
const undo = "[data-sonner-toast] [data-action]";
const openStage = (stage: string) => click(`${teachTarget(`stage-${stage}`)}[aria-expanded="false"]`, { optional: true });
const varKey = teachTarget("key-values", "input:nth-of-type(1)");
const varValue = teachTarget("key-values", "input:nth-of-type(2)");

export const checks: Lesson = {
  id: "checks",
  level: "further",
  icon: "checks",
  steps: [
    chapter("mistakes"),
    go("/"),
    say("intro"),
    type(teachTarget("new-project-form", "input"), projectName, { say: "name" }),
    click(teachTarget("new-project-form", 'button[type="submit"]')),
    click(teachTarget("start-inventory"), { say: "inventory", learn: "how-to/import-an-inventory" }),
    type(teachTarget("host-name"), demo("host")),
    type(teachTarget("host-address"), demo("address")),
    type(hostGroups, demo("group"), { enter: true, say: "hostGroup" }),
    click(teachTarget("add-host"), { say: "addHost" }),
    type(`${secondRow} ${teachTarget("host-name")}`, demo("host"), { say: "duplicate" }),
    type(`${secondRow} ${teachTarget("host-address")}`, demo("address2")),
    point(secondRow, "formCatch"),
    type(`${secondRow} ${teachTarget("host-name")}`, demo("host2"), { say: "rename" }),
    type(`${secondRow} [role="combobox"]`, demo("group"), { enter: true }),
    click(connection, { say: "connection" }),
    type(teachTarget("host-user"), demo("hostUser"), { say: "hostUser" }),
    click(withText(teachTarget("suggestion"), demo("group")), { say: "groupRow" }),
    type(teachTarget("group-row", "textarea"), demo("groupVar"), { say: "groupVar" }),
    point(teachTarget("preview"), "quiet"),
    click(teachTarget("save"), { say: "saveInventory" }),
    openStage("configure"),
    click(teachTarget("catalog-playbook", "button"), { say: "playbook", learn: "how-to/multi-play-playbooks" }),
    type(editorName, demo("playbook")),
    type(playName, demo("play")),
    type(teachTarget("play-hosts"), demo("wrongHosts"), { say: "wrongHosts" }),
    type(playRoles, demo("role"), { enter: true }),
    click(teachTarget("save"), { say: "savePlaybook" }),

    chapter("read"),
    point(teachTarget("tab-checks"), "badge", { learn: "reference/checks" }),
    click(teachTarget("tab-checks")),
    point(withText(teachTarget("issue-row"), demo("play")), "playRow"),
    point(teachTarget("issue-scaffold"), "note", { learn: "how-to/scaffold-roles" }),
    click(teachTarget("issue-scaffold"), { say: "scaffold" }),
    click(withText(teachTarget("issue-open"), demo("playbook")), { say: "openRow" }),
    point(teachTarget("editor-issues"), "inline"),
    task("fixHosts", {
      checks: {
        hosts: withText(teachTarget("play-hosts"), demo("group")),
        count: withText(teachTarget("tab-checks"), lit("1")),
      },
      show: [type(teachTarget("play-hosts"), demo("group")), click(teachTarget("save"))],
      learn: "reference/checks",
    }),

    chapter("override"),
    click(teachTarget("tab-checks"), { say: "oneLeft" }),
    point(withText(teachTarget("issue-row"), demo("hostUser")), "override", { learn: "how-to/group-vars" }),
    click(withText(teachTarget("issue-open"), projectName), { say: "openInventory" }),
    click(connection),
    point(teachTarget("host-user"), "inherit"),
    task("clearUser", {
      checks: { clear: teachTarget("checks-clear") },
      show: [type(teachTarget("host-user"), lit("")), click(teachTarget("save")), click(teachTarget("tab-checks"))],
    }),
    point(teachTarget("checks-clear"), "clear"),

    chapter("addresses"),
    click(teachTarget("tab-build"), { say: "secondInventory" }),
    openStage("inventory"),
    click(teachTarget("catalog-inventory", "button")),
    type(editorName, demo("inventory2")),
    type(teachTarget("host-name"), demo("host")),
    type(teachTarget("host-address"), demo("address3"), { say: "otherAddress" }),
    type(hostGroups, demo("group"), { enter: true }),
    click(teachTarget("save"), { say: "saveStaging" }),
    point(teachTarget("tab-checks"), "redBadge"),
    click(teachTarget("tab-checks")),
    point(withText(teachTarget("issue-row"), demo("address3")), "twoAddresses"),
    click(teachTarget("tab-build"), { say: "toBuild" }),
    click(teachTarget("project-drawer"), { optional: true }),
    click(secondRemove, { say: "remove" }),
    click(undo),
    point(teachTarget("tab-checks"), "undone"),
    click(teachTarget("project-drawer"), { optional: true }),
    click(secondRemove, { say: "removeAgain" }),

    chapter("conflicts"),
    openStage("inventory"),
    click(teachTarget("catalog-groupvars", "button"), { say: "groupVars", learn: "how-to/resolve-conflicts" }),
    type(teachTarget("groupvars-group", "input"), demo("group")),
    type(varKey, demo("varKey")),
    type(varValue, demo("varValue")),
    click(teachTarget("save"), { say: "saveGroupVars" }),
    click(teachTarget("catalog-groupvars", "button"), { say: "again" }),
    type(teachTarget("groupvars-group", "input"), demo("group")),
    type(varKey, demo("varKey")),
    type(varValue, demo("varValue2")),
    point(teachTarget("save-conflict"), "liveWarning"),
    click(teachTarget("save"), { say: "saveAnyway" }),
    point(teachTarget("conflict-dialog"), "dialog"),
    click(teachTarget("conflict-file")),
    point(teachTarget("conflict-diff"), "diff"),
    click(teachTarget("conflict-keep"), { say: "keep" }),
    say("done"),
  ],
};
