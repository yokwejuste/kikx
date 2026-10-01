import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BUILT = "public/docs/index.html";
const SOURCES = ["../docs/source", "../docs/locales"];

function newestChange(path) {
  const stats = statSync(path);
  if (!stats.isDirectory()) return stats.mtimeMs;
  return readdirSync(path).reduce((newest, entry) => Math.max(newest, newestChange(join(path, entry))), stats.mtimeMs);
}

function builtAt() {
  try {
    return statSync(BUILT).mtimeMs;
  } catch {
    return 0;
  }
}

process.exit(SOURCES.some((path) => newestChange(path) > builtAt()) ? 1 : 0);
