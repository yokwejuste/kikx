"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { catalogEntry, describeComponent, type CatalogKind, type StageId } from "@/lib/registry/catalog";
import type { PresetComponent } from "@/lib/project/preset";

export function useCatalogText() {
  const t = useTranslations("catalog");
  const registry = useTranslations("registry");

  return useMemo(() => {
    const pick = (key: string, fallback: string) => (registry.has(key) ? registry(key) : fallback);
    const entry = (kind: CatalogKind) => {
      const base = catalogEntry(kind);
      if (kind === "custom") {
        return { ...base, label: t("custom.label"), summary: t("custom.summary"), writes: t("custom.writes") };
      }
      return {
        ...base,
        label: pick(`${kind}.title`, base.label),
        summary: pick(`${kind}.description`, base.summary),
        writes: base.writes ?? t("custom.writes"),
      };
    };
    return {
      stage: (id: StageId) => ({ label: t(`stages.${id}.label`), hint: t(`stages.${id}.hint`) }),
      entry,
      describe: (recipe: PresetComponent) => {
        const described = describeComponent(recipe);
        return described.kind === "custom" ? described : { ...described, kindLabel: entry(described.kind).label };
      },
      fieldHelp: (kind: CatalogKind, field: string, fallback: string | null | undefined) =>
        pick(`${kind}.fields.${field}`, fallback ?? "") || undefined,
      preset: (name: string, field: "title" | "description", fallback: string) => pick(`presets.${name}.${field}`, fallback),
    };
  }, [t, registry]);
}
