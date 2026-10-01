import { docsHref } from "@/lib/i18n/docs";
import type { CatalogKind, StageId } from "@/lib/registry/catalog";

const GLOSSARY = {
  namespace: "reference/configuration",
  outputDir: "explanation/project-layout",
  inventory: "how-to/import-an-inventory",
  groupVars: "how-to/group-vars",
  siteYml: "how-to/site-playbook",
  role: "how-to/scaffold-roles",
  preset: "how-to/presets",
  registryItem: "reference/registry-item-format",
} as const satisfies Record<string, string>;

export type GlossaryTerm = keyof typeof GLOSSARY;

export const STAGE_TERMS: Partial<Record<StageId, GlossaryTerm>> = {
  inventory: "inventory",
  configure: "role",
  deploy: "namespace",
  custom: "registryItem",
};

export const KIND_TERMS: Partial<Record<CatalogKind, GlossaryTerm>> = {
  inventory: "inventory",
  groupvars: "groupVars",
  site: "siteYml",
  role: "role",
  commonrole: "role",
  custom: "registryItem",
};

export function glossaryDocsHref(term: GlossaryTerm, locale: string): string {
  return docsHref(GLOSSARY[term], locale);
}
