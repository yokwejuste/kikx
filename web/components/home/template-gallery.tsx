"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutTemplate, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/common/icon-tile";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { api } from "@/lib/api/client";
import { stagesForReferences } from "@/lib/registry/catalog";
import { cn } from "@/lib/utils";

export function TemplateGallery({
  opening,
  onSelect,
}: {
  opening: string | null;
  onSelect: (name: string) => void;
}) {
  const t = useTranslations("templates");
  const text = useCatalogText();
  const presets = useQuery({ queryKey: ["kikx-presets"], queryFn: api.presets, staleTime: Infinity });

  if (!presets.data?.length) return null;

  return (
    <section data-tour="templates" className="w-full text-left">
      <h2 className="text-sm font-medium">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("body")}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {presets.data.map((preset) => (
          <li key={preset.name}>
            <button
              data-teach="template"
              type="button"
              disabled={opening !== null}
              onClick={() => onSelect(preset.name)}
              className={cn(
                "flex h-full w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:border-brand/40 hover:bg-muted/40 disabled:opacity-60",
                opening === preset.name && "border-brand",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <IconTile
                  size="sm"
                  icon={opening === preset.name ? LoaderCircle : LayoutTemplate}
                  iconClassName={cn(opening === preset.name && "animate-spin")}
                />
                {text.preset(preset.name, "title", preset.title)}
              </span>
              <span className="text-sm text-muted-foreground">{text.preset(preset.name, "description", preset.description)}</span>
              <span className="flex flex-wrap gap-1.5">
                <span className="sr-only">{t("covers")}</span>
                {stagesForReferences(preset.references).map((id) => (
                  <Badge key={id} variant="outline" className="font-normal text-muted-foreground" title={text.stage(id).hint}>
                    {text.stage(id).label}
                  </Badge>
                ))}
              </span>
              <span className="mt-auto font-mono text-xs text-muted-foreground">
                {preset.name} · {t("components", { count: preset.componentCount })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
