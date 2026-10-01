import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { SCENES } from "./scenes.mjs";
import { SHOTS } from "./shots.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");

const { values: options } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    out: { type: "string", default: join(here, "..", "source", "images", "web") },
    only: { type: "string" },
    themes: { type: "string", default: "light,dark" },
    locales: { type: "string", default: "en,fr" },
    quality: { type: "string", default: "80" },
    "max-kb": { type: "string", default: "120" },
    headed: { type: "boolean", default: false },
  },
});

const base = options.base.replace(/\/$/, "");
const wanted = options.only ? new Set(options.only.split(",")) : null;
const shots = SHOTS.filter((shot) => !wanted || wanted.has(shot.name));
const themes = options.themes.split(",");
const locales = options.locales.split(",");
const maxBytes = Number(options["max-kb"]) * 1024;
const scratch = mkdtempSync(join(tmpdir(), "kikx-shots-"));
const cwebp = process.env.CWEBP ?? "cwebp";

const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 2;
const MAX_WIDTH = 1600;

const HIDE = `
  nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
  html:not([data-shot-toasts]) [data-sonner-toaster] { display: none !important; }
  * { caret-color: transparent !important; }
  .sticky { position: static !important; }
`;

const messages = Object.fromEntries(
  locales.map((locale) => [locale, JSON.parse(readFileSync(join(repo, "web", "messages", `${locale}.json`), "utf8"))]),
);

function label(locale, key) {
  return key.split(".").reduce((node, part) => node?.[part], messages[locale]) ?? key;
}

async function newContext(browser, theme, locale) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    colorScheme: theme,
    reducedMotion: "reduce",
    locale: locale === "fr" ? "fr-FR" : "en-US",
    acceptDownloads: true,
  });
  await context.addCookies([{ name: "NEXT_LOCALE", value: locale, url: base }]);
  await context.addInitScript(
    ({ css, theme }) => {
      localStorage.setItem("theme", theme);
      localStorage.setItem("kikx.tour.seen.home", "1");
      localStorage.setItem("kikx.tour.seen.builder", "1");
      const inject = () => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.append(style);
      };
      if (document.head) inject();
      else document.addEventListener("DOMContentLoaded", inject);
    },
    { css: HIDE, theme },
  );
  return context;
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function restore(page, storage) {
  await page.goto(`${base}/icon.svg`);
  await page.evaluate((entries) => {
    for (const key of Object.keys(localStorage)) if (key.startsWith("kikx")) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    localStorage.setItem("kikx.tour.seen.home", "1");
    localStorage.setItem("kikx.tour.seen.builder", "1");
  }, storage ?? {});
}

async function snapshot(page) {
  return page.evaluate(() =>
    Object.fromEntries(
      Object.entries(localStorage).filter(
        ([key]) => key.startsWith("kikx:") && !key.startsWith("kikx:draft:") && key !== "kikx:builder",
      ),
    ),
  );
}

async function buildScenes(browser) {
  const needed = new Set();
  const require = (name) => {
    if (!SCENES[name]) throw new Error(`Unknown scene ${name}`);
    if (SCENES[name].from) require(SCENES[name].from);
    needed.add(name);
  };
  for (const shot of shots) if (shot.scene) require(shot.scene);
  const built = {};
  if (needed.size === 0) return built;
  const context = await newContext(browser, "light", "en");
  const page = await context.newPage();
  for (const name of needed) {
    const scene = SCENES[name];
    await restore(page, scene.from ? built[scene.from] : {});
    await scene.build({ page, base, settle });
    await page.waitForTimeout(700);
    built[name] = await snapshot(page);
    process.stdout.write(`scene ${name}\n`);
  }
  await context.close();
  return built;
}

async function clipFor(page, selectors, pad, union, inViewport) {
  const boxes = [];
  for (const selector of selectors) {
    const matches = page.locator(selector).filter({ visible: true });
    await matches.first().waitFor({ state: "visible", timeout: 15000 });
    const count = union ? await matches.count() : 1;
    for (let index = 0; index < count; index++) {
      const box = await matches.nth(index).boundingBox();
      if (box && box.width > 0 && box.height > 0) boxes.push(box);
    }
  }
  const scroll = inViewport ? { x: 0, y: 0 } : await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const left = Math.max(0, Math.min(...boxes.map((box) => box.x)) - pad);
  const top = Math.max(0, Math.min(...boxes.map((box) => box.y)) - pad);
  const right = Math.min(VIEWPORT.width, Math.max(...boxes.map((box) => box.x + box.width)) + pad);
  const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + pad;
  return { x: left + scroll.x, y: top + scroll.y, width: right - left, height: bottom - top };
}

function encode(png, target, cssWidth, maxWidth = MAX_WIDTH) {
  const width = cssWidth * SCALE;
  const resize = width > maxWidth ? ["-resize", String(maxWidth), "0"] : [];
  let quality = Number(options.quality);
  for (;;) {
    execFileSync(cwebp, ["-quiet", "-q", String(quality), "-m", "6", ...resize, png, "-o", target]);
    if (statSync(target).size <= maxBytes || quality <= 50) return statSync(target).size;
    quality -= 10;
  }
}

function fileName(name, theme, locale) {
  return `${name}${theme === "dark" ? "-dark" : ""}${locale === "en" ? "" : `.${locale}`}.webp`;
}

async function capture(page, shot, scenes, theme, locale) {
  await restore(page, shot.scene ? scenes[shot.scene] : {});
  await page.goto(`${base}${shot.path ?? "/build"}`);
  await settle(page);
  const t = (key) => label(locale, key);
  if (shot.toasts) await page.evaluate(() => document.documentElement.setAttribute("data-shot-toasts", ""));
  if (shot.act) await shot.act({ page, t, base, settle, locale });
  await settle(page);
  if (shot.wait) await page.waitForTimeout(shot.wait);
  const png = join(scratch, `${shot.name}.png`);
  if (!shot.keepFocus) await page.evaluate(() => document.activeElement?.blur?.());
  if (shot.target) {
    const target = typeof shot.target === "function" ? shot.target({ t }) : shot.target;
    if (!shot.keepFocus) await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const clip = await clipFor(page, [target].flat(), shot.pad ?? 16, shot.union, shot.keepFocus);
    if (shot.maxHeight) clip.height = Math.min(clip.height, shot.maxHeight);
    await page.screenshot({ path: png, clip, fullPage: !shot.keepFocus, animations: "disabled" });
    return encode(png, join(options.out, fileName(shot.name, theme, locale)), clip.width, shot.maxWidth);
  }
  await page.screenshot({ path: png, animations: "disabled" });
  return encode(png, join(options.out, fileName(shot.name, theme, locale)), VIEWPORT.width);
}

const browser = await chromium.launch({ headless: !options.headed });
mkdirSync(options.out, { recursive: true });
let total = 0;
let failed = 0;
try {
  const scenes = await buildScenes(browser);
  for (const theme of themes) {
    for (const locale of locales) {
      const context = await newContext(browser, theme, locale);
      const page = await context.newPage();
      for (const shot of shots) {
        try {
          const size = await capture(page, shot, scenes, theme, locale);
          total += size;
          process.stdout.write(`${fileName(shot.name, theme, locale)} ${Math.round(size / 1024)} KB\n`);
        } catch (error) {
          failed++;
          process.stderr.write(`${fileName(shot.name, theme, locale)} failed: ${error.message.split("\n")[0]}\n`);
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  rmSync(scratch, { recursive: true, force: true });
}
process.stdout.write(`${Math.round(total / 1024)} KB written, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
