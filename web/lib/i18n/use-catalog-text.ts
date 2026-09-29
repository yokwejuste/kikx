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
      if (kind === "custom" || kind === "server") {
        return { ...base, label: t(`${kind}.label`), summary: t(`${kind}.summary`), writes: t(`${kind}.writes`) };
      }
      return {
        ...base,
        label: pick(`${kind}.title`, base.label),
        summary: pick(`${kind}.description`, base.summary),
        writes: base.writes ?? t("custom.writes"),
      };
    };
    const itemName = (reference: string) => reference.split("/").pop() ?? reference;
    return {
      stage: (id: StageId) => ({ label: t(`stages.${id}.label`), hint: t(`stages.${id}.hint`) }),
      entry,
      describe: (recipe: PresetComponent) => {
        const described = describeComponent(recipe);
        if (described.kind === "custom") return described;
        if (described.kind === "server") {
          return { ...described, kindLabel: pick(`${itemName(recipe.reference)}.title`, described.kindLabel) };
        }
        return { ...described, kindLabel: entry(described.kind).label };
      },
      fieldHelp: (kind: CatalogKind | string, field: string, fallback: string | null | undefined) =>
        pick(`${kind}.fields.${field}`, fallback ?? "") || undefined,
      provider: (reference: string, fallback: string) => pick(`${itemName(reference)}.title`, fallback),
      providerKey: itemName,
      preset: (name: string, field: "title" | "description", fallback: string) => pick(`presets.${name}.${field}`, fallback),
    };
  }, [t, registry]);
}
