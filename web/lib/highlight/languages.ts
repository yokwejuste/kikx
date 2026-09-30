import type { LanguageRegistration } from "shiki/core";

type LanguageModule = { default: LanguageRegistration[] };

const loaders = {
  yaml: () => import("shiki/langs/yaml.mjs"),
  terraform: () => import("shiki/langs/terraform.mjs"),
  hcl: () => import("shiki/langs/hcl.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
} satisfies Record<string, () => Promise<LanguageModule>>;

export type Language = keyof typeof loaders;

const byExtension: Record<string, Language> = {
  yml: "yaml",
  yaml: "yaml",
  tf: "terraform",
  tfvars: "terraform",
  hcl: "hcl",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
  json: "json",
  toml: "toml",
  sh: "shellscript",
  bash: "shellscript",
  dockerfile: "dockerfile",
};

const byName: Record<string, Language> = {
  dockerfile: "dockerfile",
  containerfile: "dockerfile",
  hosts: "ini",
};

export function languageFor(path: string): Language | null {
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  if (byName[name]) return byName[name];
  const dot = name.lastIndexOf(".");
  return dot === -1 ? null : (byExtension[name.slice(dot + 1)] ?? null);
}

export function loadLanguage(language: Language): Promise<LanguageModule> {
  return loaders[language]();
}
