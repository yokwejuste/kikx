import type { Lesson } from "../types.ts";
import { chapter, click, demo, go, lit, point, previewLine, projectName, say, task, teachTarget, type, withText } from "../steps.ts";

const editor = (field: string) => `[data-tour="editor"] input[name="${field}"]`;
const dialog = (inner: string) => `[role="dialog"] ${inner}`;
const addLabel = teachTarget("key-values", "> div > button");
const namespaceBadge = teachTarget("setting-namespace");
const checksClear = `${teachTarget("tab-checks")}:not(:has(svg))`;

export const kubernetes: Lesson = {
  id: "kubernetes",
  level: "further",
  icon: "kubernetes",
  steps: [
    chapter("namespace"),
    go("/"),
    say("intro"),
    type(teachTarget("new-project-form", "input"), projectName, { say: "name" }),
    click(teachTarget("new-project-form", 'button[type="submit"]'), { say: "start" }),
    point(namespaceBadge, "namespaceBadge", { learn: "explanation/rendering" }),
    say("namespaceWhy"),
    task("namespaceTask", {
      checks: { namespaceSaved: withText(namespaceBadge, demo("namespace")) },
      show: [
        click(namespaceBadge),
        type(dialog('input[name="namespace"]'), demo("namespace"), { say: "namespaceType" }),
        click(dialog('button[type="submit"]')),
      ],
    }),
    say("namespaceScope"),

    chapter("deployment"),
    click(teachTarget("start-deploy"), { say: "deployment", learn: "reference/components" }),
    type(editor("name"), demo("app"), { say: "deploymentName" }),
    type(editor("image"), demo("image"), { say: "image" }),
    type(editor("replicas"), demo("replicas"), { say: "replicas" }),
    type(editor("port"), demo("containerPort"), { say: "containerPort" }),
    point(editor("namespace"), "namespaceField"),
    click(addLabel, { say: "labels" }),
    type(editor("labels.0.key"), demo("labelKey")),
    type(editor("labels.0.value"), demo("labelValue")),
    point(previewLine(demo("appLine")), "appLine"),
    point(previewLine(demo("containerPortLine")), "containerPortLine"),
    click(teachTarget("save"), { say: "addDeployment" }),

    chapter("service"),
    click(teachTarget("catalog-service", "button"), { say: "service" }),
    type(editor("name"), demo("service"), { say: "serviceName" }),
    point(editor("port"), "servicePort"),
    type(editor("targetPort"), demo("containerPort"), { say: "targetPort" }),
    point(previewLine(demo("serviceSelectorLine")), "serviceSelector"),
    click(teachTarget("save"), { say: "addService" }),
    click(teachTarget("tab-checks"), { say: "checks", learn: "reference/checks" }),
    point(withText(teachTarget("issue-row"), demo("service")), "issue"),
    task("fixTask", {
      checks: { selectorMatches: checksClear },
      show: [
        click(withText(teachTarget("issue-row", "button"), demo("service")), { say: "fixOpen" }),
        click(addLabel),
        type(editor("labels.0.key"), lit("app")),
        type(editor("labels.0.value"), demo("app"), { say: "fixLabel" }),
        click(teachTarget("save")),
      ],
    }),
    say("fixed"),

    chapter("ingress"),
    click(teachTarget("tab-build"), { optional: true }),
    click(teachTarget("catalog-ingress", "button"), { say: "ingress" }),
    type(editor("name"), demo("app"), { say: "ingressName" }),
    task("ingressTask", {
      checks: {
        host: withText(editor("host"), demo("host")),
        backend: withText(editor("service"), demo("service")),
      },
      show: [
        type(editor("host"), demo("host"), { say: "ingressHost" }),
        type(editor("service"), demo("service"), { say: "ingressBackend" }),
      ],
    }),
    point(previewLine(demo("hostLine")), "hostLine"),
    point(previewLine(demo("backendLine")), "backendLine"),
    click(teachTarget("save"), { say: "addIngress" }),

    chapter("review"),
    click(teachTarget("tab-diagram"), { say: "diagram", learn: "explanation/architecture-diagram" }),
    say("diagramRead"),
    click(teachTarget("tab-checks"), { say: "checksClear" }),
    click(teachTarget("tab-build"), { say: "build" }),
    say("done"),
  ],
};
