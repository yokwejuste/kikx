import type { KnipConfig } from "knip";

const cssImports = (text: string) =>
  [...text.matchAll(/@import\s+["']([^"']+)["']/g)].map(([, source]) => `import "${source}";`).join("\n");

const config: KnipConfig = {
  entry: ["tests/**/*.test.mjs", "tests/support/*.mjs", "lib/i18n/request.ts"],
  project: ["**/*.{ts,tsx,mjs,css}"],
  ignoreBinaries: ["uv"],
  compilers: { css: cssImports },
};

export default config;
