import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chip,
  click,
  editor,
  field,
  fill,
  openKind,
  openPreset,
  openRow,
  openTemplate,
  save,
  startBlank,
  tab,
  teach,
} from "./steps.mjs";

const presets = fileURLToPath(new URL("../../backend/core/presets/", import.meta.url));
export const preset = (name) => join(presets, `${name}.kikx-preset.json`);

const play = (number, inner) => `${teach("play-card")}:nth-child(${number}) ${inner}`;

export const PLATFORM_INI = `[web]
web-01 ansible_host=192.0.2.10
web-02 ansible_host=192.0.2.11 ansible_user=root

[db]
db-01 ansible_host=198.51.100.20

[platform:children]
web
db

[platform:vars]
ansible_user=deploy
`;

export const DB_VARS = `postgres:
  version: 16
  max_connections: 200
  databases:
    - app
    - reports
`;

export const form = {
  async shopInventory(page) {
    await fill(page, teach("host-name"), "web1");
    await fill(page, teach("host-address"), "10.0.0.10");
    await chip(page, teach("host-row", '[role="combobox"]'), "web");
    await click(page, teach("add-host"));
    await fill(page, field("hosts.1.name"), "db1");
    await fill(page, field("hosts.1.ansibleHost"), "10.0.0.20");
    await chip(page, `${teach("host-row")}:nth-of-type(2) [role="combobox"]`, "db");
  },
  async shopGroupVars(page) {
    await openKind(page, "inventory", "groupvars");
    await fill(page, teach("groupvars-group", "input"), "web");
    await fill(page, teach("key-values", "input:nth-of-type(1)"), "http_port");
    await fill(page, teach("key-values", "input:nth-of-type(2)"), "80");
  },
  async shopPlaybook(page) {
    await openKind(page, "configure", "playbook");
    await fill(page, field("name"), "web");
    await fill(page, field("plays.0.name"), "Web servers");
    await fill(page, field("plays.0.hosts"), "web");
    await chip(page, teach("play-card", '[role="combobox"]'), "nginx");
  },
  async shopSite(page) {
    await openKind(page, "configure", "site");
    await fill(page, field("name"), "site");
    await page.locator(`${editor} form button`).filter({ hasText: "web.yml" }).first().click();
  },
  async platformImport(page) {
    await click(page, teach("inventory-import"));
    await fill(page, teach("inventory-ini"), PLATFORM_INI);
  },
  async platformGroupVars(page) {
    await openKind(page, "inventory", "groupvars");
    await fill(page, teach("groupvars-group", "input"), "db");
    await page.locator(`${editor} input[name="layout"]`).check();
    await click(page, teach("groupvars-yaml"));
    await fill(page, teach("groupvars-yaml-text"), DB_VARS);
  },
  async platformPlaybook(page) {
    await openKind(page, "configure", "playbook");
    await fill(page, field("name"), "services");
    await fill(page, teach("field-folder"), "playbooks");
    await fill(page, play(1, "input"), "Web tier");
    await fill(page, play(1, "input[list]"), "web");
    await chip(page, play(1, '[role="combobox"]'), "nginx");
    await click(page, teach("add-play"));
    await fill(page, play(2, "input"), "Database tier");
    await fill(page, play(2, "input[list]"), "db");
    await chip(page, play(2, '[role="combobox"]'), "postgres", "backups");
    await click(page, play(2, "details:first-of-type > summary"));
    await fill(page, play(2, "details[open] label:last-of-type input"), "backups_enabled | default(true)");
  },
  async platformSite(page) {
    await openKind(page, "configure", "site");
    await fill(page, field("name"), "site");
    await page.locator(`${editor} form button`).filter({ hasText: "playbooks/services.yml" }).first().click();
    await fill(page, field("imports.0.name"), "Services");
  },
  async platformConfig(page) {
    await openKind(page, "configure", "ansiblecfg");
    await fill(page, teach("field-inventory"), "platform-inventory.ini");
  },
  async platformConnection(page) {
    await openRow(page, "platform");
    await click(page, `${teach("host-row")}:nth-of-type(2) summary`);
  },
  async deployment(page) {
    await openKind(page, "deploy", "deployment");
    await fill(page, field("name"), "shop");
    await fill(page, field("image"), "nginx:1.27");
    await fill(page, field("replicas"), "3");
    await fill(page, field("port"), "8080");
    await click(page, teach("key-values", "> div > button"));
    await fill(page, field("labels.0.key"), "tier");
    await fill(page, field("labels.0.value"), "web");
  },
  async service(page, name = "shop") {
    await openKind(page, "deploy", "service");
    await fill(page, field("name"), name);
    await fill(page, field("port"), "80");
    await fill(page, field("targetPort"), "8080");
  },
  async ingress(page) {
    await openKind(page, "deploy", "ingress");
    await fill(page, field("name"), "shop");
    await fill(page, field("host"), "shop.example.com");
    await fill(page, field("service"), "shop");
    await fill(page, field("port"), "80");
  },
  async provider(page, name) {
    await click(page, `${editor} button[role="combobox"]`);
    await page.locator('[role="option"]').filter({ hasText: name }).first().click();
  },
  async server(page, name, provider, region, size) {
    await openKind(page, "provision", "server");
    await fill(page, field("name"), name);
    await form.provider(page, provider);
    await fill(page, field("fields.region"), region);
    await fill(page, field("fields.size"), size);
  },
};

const resume = async (page, base) => {
  await page.goto(`${base}/build`);
  await page.locator('[data-tour="editor"], [data-teach="start-panel"]').first().waitFor();
};

export const SCENES = {
  "shop-start": {
    build: async ({ page, base }) => startBlank(page, base, "shop"),
  },
  "shop-inventory": {
    from: "shop-start",
    build: async ({ page, base }) => {
      await resume(page, base);
      await click(page, teach("start-inventory"));
      await form.shopInventory(page);
      await save(page);
    },
  },
  "shop-groupvars": {
    from: "shop-inventory",
    build: async ({ page, base }) => {
      await resume(page, base);
      await form.shopGroupVars(page);
      await save(page);
    },
  },
  "shop-playbook": {
    from: "shop-groupvars",
    build: async ({ page, base }) => {
      await resume(page, base);
      await form.shopPlaybook(page);
      await save(page);
    },
  },
  "shop-scaffolded": {
    from: "shop-playbook",
    build: async ({ page, base }) => {
      await resume(page, base);
      await tab(page, "checks");
      await click(page, teach("issue-scaffold"));
      await page.waitForTimeout(1500);
      await tab(page, "build");
    },
  },
  "shop-done": {
    from: "shop-scaffolded",
    build: async ({ page, base }) => {
      await resume(page, base);
      await form.shopSite(page);
      await save(page);
    },
  },
  "platform-start": {
    build: async ({ page, base }) => startBlank(page, base, "platform"),
  },
  "platform-inventory": {
    from: "platform-start",
    build: async ({ page, base }) => {
      await resume(page, base);
      await click(page, teach("start-inventory"));
      await form.platformImport(page);
      await click(page, teach("inventory-replace"));
      await save(page);
    },
  },
  "platform-warning": {
    from: "platform-inventory",
    build: async ({ page, base }) => {
      await resume(page, base);
      await form.platformGroupVars(page);
      await save(page);
      await form.platformPlaybook(page);
      await save(page);
      await form.platformSite(page);
      await save(page);
      await form.platformConfig(page);
      await save(page);
    },
  },
  "platform-done": {
    from: "platform-warning",
    build: async ({ page, base }) => {
      await resume(page, base);
      await form.platformConnection(page);
      await fill(page, `${teach("host-row")}:nth-of-type(2) ${teach("host-user")}`, "");
      await save(page);
      await tab(page, "checks");
      await click(page, teach("issue-scaffold"));
      await page.waitForTimeout(2000);
      await tab(page, "build");
    },
  },
  "k8s-start": {
    build: async ({ page, base }) => {
      await startBlank(page, base, "shop");
      await click(page, teach("setting-namespace"));
      await fill(page, '[role="dialog"] input[name="namespace"]', "shop-prod");
      await click(page, '[role="dialog"] button[type="submit"]');
      await page.waitForTimeout(500);
    },
  },
  "k8s-broken": {
    from: "k8s-start",
    build: async ({ page, base }) => {
      await resume(page, base);
      await click(page, teach("start-deploy"));
      await form.deployment(page);
      await save(page);
      await form.service(page, "frontend");
      await save(page);
    },
  },
  "k8s-done": {
    from: "k8s-start",
    build: async ({ page, base }) => {
      await resume(page, base);
      await click(page, teach("start-deploy"));
      await form.deployment(page);
      await save(page);
      await form.service(page);
      await save(page);
      await form.ingress(page);
      await save(page);
    },
  },
  "servers-start": {
    build: async ({ page, base }) => startBlank(page, base, "cloud"),
  },
  "servers-done": {
    from: "servers-start",
    build: async ({ page, base }) => {
      await resume(page, base);
      await form.server(page, "web", "Hetzner", "fsn1", "cx22");
      await save(page);
      await form.server(page, "db", "DigitalOcean", "ams3", "s-1vcpu-2gb");
      await save(page);
      await openKind(page, "inventory", "inventory");
      await fill(page, field("name"), "hosts");
      await fill(page, teach("host-name"), "web-0");
      await fill(page, teach("host-address"), "203.0.113.10");
      await chip(page, teach("host-row", '[role="combobox"]'), "web");
      await save(page);
    },
  },
  "template-multi": {
    build: async ({ page, base }) => openTemplate(page, base, "Multi-tier platform"),
  },
};
