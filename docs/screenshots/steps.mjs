export const teach = (id, inner) => `[data-teach="${id}"]${inner ? ` ${inner}` : ""}`;
export const editor = '[data-tour="editor"]';
export const field = (name) => `${editor} input[name="${name}"]`;
export const toast = "[data-sonner-toast]";

export async function fill(page, selector, value) {
  const input = page.locator(selector).first();
  await input.click();
  await input.fill(value);
}

export async function chip(page, selector, ...values) {
  const input = page.locator(selector).first();
  for (const value of values) {
    await input.click();
    await input.pressSequentially(value);
    await input.press("Enter");
  }
}

export async function click(page, selector) {
  await page.locator(selector).first().click();
}

export async function optional(page, selector) {
  const target = page.locator(selector).first();
  if (await target.isVisible().catch(() => false)) await target.click();
}

export async function openStage(page, stage) {
  await optional(page, `${teach(`stage-${stage}`)}[aria-expanded="false"]`);
}

export async function openKind(page, stage, kind) {
  await openStage(page, stage);
  const entry = page.locator(teach(`catalog-${kind}`, "button")).first();
  if (!(await entry.isVisible().catch(() => false))) await optional(page, teach(`more-${stage}`));
  await entry.click();
  await page.waitForTimeout(300);
}

export async function save(page) {
  await page.locator(teach("save")).first().click();
  await page.waitForTimeout(600);
}

export async function startBlank(page, base, name) {
  await page.goto(`${base}/`);
  await fill(page, teach("new-project-form", "input"), name);
  await page.locator(teach("new-project-form", 'button[type="submit"]')).click();
  await page.waitForURL(/\/build/);
  await page.locator(teach("start-panel")).waitFor();
}

export async function openPreset(page, base, file) {
  await page.goto(`${base}/`);
  const chooser = page.waitForEvent("filechooser");
  await page.locator('[data-tour="open-preset"]').first().click();
  await (await chooser).setFiles(file);
  await page.waitForURL(/\/build/, { timeout: 30000 });
  await page.waitForTimeout(1500);
}

export async function openTemplate(page, base, title) {
  await page.goto(`${base}/`);
  await page.locator(teach("template")).filter({ hasText: title }).first().click();
  await page.waitForURL(/\/build/, { timeout: 30000 });
  await page.waitForTimeout(1500);
}

export async function tab(page, id) {
  await page.locator(teach(`tab-${id}`)).first().click();
  await page.waitForTimeout(500);
}

export async function openRow(page, text) {
  await optional(page, teach("project-drawer"));
  await page.locator(teach("component-row")).filter({ has: page.getByText(text, { exact: true }) }).first().click();
  await page.waitForTimeout(400);
}
