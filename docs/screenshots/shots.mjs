import { form } from "./scenes.mjs";
import { click, editor, fill, openKind, openRow, save, tab, teach } from "./steps.mjs";

const dialog = '[role="dialog"]';
const nodes = ".react-flow__node";
const checksPanel = ['[data-tour="views"]', "div.gap-6:has(> section [data-teach='issue-row'])"];
const homeCard = "main div.rounded-xl:has(> a[href='/build'], [role='alertdialog'])";

const diagram = (scene, extra) => ({
  scene,
  act: async ({ page, ...rest }) => {
    await tab(page, "diagram");
    await page.locator(nodes).first().waitFor();
    await page.waitForTimeout(1200);
    if (extra) await extra({ page, ...rest });
  },
  target: nodes,
  union: true,
  pad: 12,
  maxWidth: 2880,
});

async function waitForCard(page, test) {
  await page.waitForFunction(test, null, { timeout: 120000, polling: 250 });
  await page.waitForTimeout(800);
}

export const SHOTS = [
  { name: "home", path: "/" },
  {
    name: "home-cli",
    path: "/",
    act: async ({ page }) => click(page, teach("mode-cli")),
    target: ['[data-tour="cli"]', '[role="tabpanel"]'],
    pad: 24,
  },
  { name: "templates", path: "/", target: '[data-tour="templates"]', pad: 24 },
  { name: "blank-project", path: "/", target: ['[data-tour="new-project"]', '[data-tour="open-preset"]'], pad: 24 },
  { name: "resume-card", scene: "shop-done", path: "/", target: ['[data-tour="welcome"]', homeCard], pad: 24 },
  {
    name: "replace-prompt",
    scene: "shop-done",
    path: "/",
    act: async ({ page }) => {
      await page.locator(teach("template")).first().click();
      await page.locator('[role="alertdialog"]').waitFor();
    },
    target: homeCard,
    pad: 24,
  },
  {
    name: "discard-prompt",
    scene: "shop-done",
    path: "/",
    act: async ({ page }) => {
      await page.locator(`${homeCard} button`).first().click();
      await page.locator('[role="alertdialog"]').waitFor();
    },
    target: homeCard,
    pad: 24,
  },
  {
    name: "tour",
    path: "/",
    act: async ({ page }) => {
      await click(page, '[data-tour="tour-button"]');
      await page.locator(".driver-popover").waitFor();
      await page.waitForTimeout(800);
    },
  },

  { name: "builder-empty", scene: "shop-start" },
  {
    name: "inventory-form",
    scene: "shop-start",
    act: async ({ page }) => {
      await click(page, teach("start-inventory"));
      await form.shopInventory(page);
    },
    target: editor,
  },
  {
    name: "inventory-added",
    scene: "shop-start",
    toasts: true,
    act: async ({ page }) => {
      await click(page, teach("start-inventory"));
      await form.shopInventory(page);
      await save(page);
      await page.mouse.move(700, 450);
    },
  },
  { name: "checklist", scene: "shop-inventory", target: '[data-tour="checklist"]' },
  { name: "groupvars-form", scene: "shop-inventory", act: async ({ page }) => form.shopGroupVars(page), target: editor },
  { name: "playbook-form", scene: "shop-groupvars", act: async ({ page }) => form.shopPlaybook(page), target: editor },
  {
    name: "editor-issues",
    scene: "shop-playbook",
    act: async ({ page }) => openRow(page, "web"),
    target: editor,
    maxHeight: 520,
  },
  { name: "checks-missing-role", scene: "shop-playbook", act: async ({ page }) => tab(page, "checks"), target: checksPanel },
  {
    name: "project-panel",
    scene: "shop-done",
    act: async ({ page }) => {
      await page.locator(teach("component-row")).filter({ hasText: "nginx" }).first().hover();
      await page.locator("li").filter({ has: page.locator(teach("component-row")).filter({ hasText: "nginx" }) }).locator(teach("component-files")).first().click();
    },
    target: '[data-tour="project"]',
  },
  { name: "site-form", scene: "shop-scaffolded", act: async ({ page }) => form.shopSite(page), target: editor },
  { name: "architecture-shop", ...diagram("shop-done") },
  {
    name: "export-menu",
    scene: "shop-done",
    act: async ({ page }) => {
      await click(page, '[data-tour="download"]');
      await page.locator('[role="menu"]').waitFor();
    },
    keepFocus: true,
    target: ['[data-tour="download"]', '[role="menu"]'],
    pad: 16,
  },
  {
    name: "cli-dialog",
    scene: "shop-done",
    act: async ({ page }) => {
      await click(page, '[data-tour="download"]');
      await page.locator('[role="menuitem"]').nth(2).click();
      await page.locator(dialog).waitFor();
    },
    target: dialog,
    pad: 0,
  },
  {
    name: "settings-dialog",
    scene: "shop-done",
    act: async ({ page }) => {
      await click(page, teach("setting-namespace"));
      await fill(page, `${dialog} input[name="namespace"]`, "shop-prod");
    },
    target: dialog,
    pad: 0,
  },
  {
    name: "conflict-dialog",
    scene: "shop-groupvars",
    act: async ({ page }) => {
      await openKind(page, "inventory", "groupvars");
      await fill(page, teach("groupvars-group", "input"), "web");
      await fill(page, teach("key-values", "input:nth-of-type(1)"), "http_port");
      await fill(page, teach("key-values", "input:nth-of-type(2)"), "8080");
      await page.waitForTimeout(600);
      await click(page, teach("save"));
      await page.locator(teach("conflict-dialog")).waitFor();
      await click(page, teach("conflict-file"));
    },
    target: dialog,
    pad: 0,
  },
  {
    name: "draft-restored",
    scene: "shop-inventory",
    act: async ({ page, base, settle }) => {
      await openKind(page, "inventory", "groupvars");
      await fill(page, teach("groupvars-group", "input"), "db");
      await fill(page, teach("key-values", "input:nth-of-type(1)"), "max_connections");
      await fill(page, teach("key-values", "input:nth-of-type(2)"), "200");
      await page.waitForTimeout(1200);
      await page.goto(`${base}/build`);
      await settle(page);
    },
    target: editor,
    maxHeight: 560,
  },
  {
    name: "remove-undo",
    scene: "shop-done",
    toasts: true,
    act: async ({ page }) => {
      const row = page.locator("li").filter({ has: page.locator(teach("component-row")).filter({ hasText: "site" }) }).first();
      await row.hover();
      await row.locator(teach("component-remove")).click();
      await page.locator("[data-sonner-toast]").first().waitFor();
      await page.mouse.move(700, 450);
    },
  },

  {
    name: "import-dialog",
    scene: "platform-start",
    act: async ({ page }) => {
      await click(page, teach("start-inventory"));
      await form.platformImport(page);
    },
    target: dialog,
    pad: 0,
  },
  {
    name: "inventory-groups",
    scene: "platform-start",
    act: async ({ page }) => {
      await click(page, teach("start-inventory"));
      await form.platformImport(page);
      await click(page, teach("inventory-replace"));
    },
    target: editor,
  },
  { name: "groupvars-yaml", scene: "platform-inventory", act: async ({ page }) => form.platformGroupVars(page), target: editor },
  { name: "playbook-plays", scene: "platform-inventory", act: async ({ page }) => form.platformPlaybook(page), target: editor },
  { name: "checks-warning", scene: "platform-warning", act: async ({ page }) => tab(page, "checks"), target: checksPanel },
  {
    name: "host-override",
    scene: "platform-warning",
    act: async ({ page }) => form.platformConnection(page),
    target: `${teach("host-row")}:nth-of-type(2)`,
    pad: 6,
  },
  { name: "architecture-platform", ...diagram("platform-done") },
  {
    name: "architecture-hover",
    ...diagram("platform-done", async ({ page }) => {
      await page.locator(nodes).filter({ hasText: "services.yml" }).first().hover();
      await page.waitForTimeout(600);
    }),
  },
  {
    name: "drawio-export",
    ...diagram("shop-done"),
    target: ({ t }) => `xpath=//button[contains(., "${t("diagram.export")}")]/../..`,
    union: false,
    maxWidth: 1600,
  },

  { name: "builder-template", scene: "template-multi" },
  {
    name: "file-dialog",
    scene: "template-multi",
    act: async ({ page }) => {
      await page.locator(teach("component-files")).first().click();
      await page.locator(teach("component-file")).first().click();
      await page.locator(dialog).waitFor();
    },
    target: dialog,
    pad: 0,
  },
  { name: "architecture-template", ...diagram("template-multi") },

  {
    name: "server-form",
    scene: "servers-start",
    act: async ({ page }) => {
      await click(page, teach("start-provision"));
      await fill(page, '[data-tour="editor"] input[name="name"]', "web");
      await form.provider(page, "Hetzner");
      await fill(page, '[data-tour="editor"] input[name="fields.region"]', "fsn1");
      await fill(page, '[data-tour="editor"] input[name="fields.size"]', "cx22");
    },
    target: editor,
  },
  {
    name: "provider-list",
    scene: "servers-start",
    act: async ({ page }) => {
      await click(page, teach("start-provision"));
      await click(page, `${editor} button[role="combobox"]`);
      await page.locator('[role="listbox"]').waitFor();
    },
    keepFocus: true,
    target: [`${editor} button[role="combobox"]`, '[role="listbox"]'],
    pad: 24,
  },
  { name: "architecture-servers", ...diagram("servers-done") },

  {
    name: "deployment-form",
    scene: "k8s-start",
    act: async ({ page }) => {
      await click(page, teach("start-deploy"));
      await form.deployment(page);
    },
    target: editor,
  },
  { name: "checks-service", scene: "k8s-broken", act: async ({ page }) => tab(page, "checks"), target: checksPanel },
  { name: "architecture-k8s", ...diagram("k8s-done") },

  { name: "data-flow", path: "/flow" },

  { name: "lesson-picker", path: "/learn/app", act: async ({ page }) => page.locator(dialog).waitFor(), target: dialog },
  {
    name: "lesson-card",
    path: "/?teach=firstProject",
    act: async ({ page }) =>
      waitForCard(page, () => {
        const preview = document.querySelector('[data-teach="preview"]');
        return preview && preview.textContent.includes("[web]") && document.querySelector("[data-teach-ui]");
      }),
  },
  {
    name: "lesson-your-turn",
    path: "/?teach=firstProject",
    act: async ({ page }) => waitForCard(page, () => document.querySelector("[data-teach-ui] ul li")),
  },
  {
    name: "cli-practice",
    path: "/learn/cli",
    act: async ({ page }) => {
      await page.locator(dialog).waitFor();
      await page.keyboard.press("Escape");
      for (const line of ["kikx init --name shop", "kikx add k8s/deployment --name shop --set image=nginx:1.27", "ls infra"]) {
        await page.locator(teach("cli-input")).click();
        await page.keyboard.type(line);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(2500);
      }
    },
  },
  { name: "cli-lesson-picker", path: "/learn/cli", act: async ({ page }) => page.locator(dialog).waitFor(), target: dialog },
];
