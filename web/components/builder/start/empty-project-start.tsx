"use client";

import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyProjectIllustration } from "@/components/illustrations/illustrations";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { LessonChooser } from "@/components/teach/lesson-chooser";
import { CATALOG, type CatalogKind } from "@/lib/registry/catalog";
import { SectionLabel } from "@/components/common/section-label";

export function EmptyProjectStart({ onSelect }: { onSelect: (kind: CatalogKind) => void }) {
  const t = useTranslations("builder.start");
  const text = useCatalogText();

  return (
    <section data-teach="start-panel" className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-4">
        <EmptyProjectIllustration className="hidden h-14 sm:block" />
        <div className="min-w-0">
          <h2 className="font-medium">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("body")}</p>
        </div>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {CATALOG.map((stage, index) => {
          const stageText = text.stage(stage.id);
          const first = text.entry(stage.entries[0].kind);
          const Icon = first.icon;
          return (
            <li key={stage.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <SectionLabel as="span" className="text-foreground">{stageText.label}</SectionLabel>
                {stage.id === "provision" && <Badge variant="outline">{t("optional")}</Badge>}
              </div>
              <p className="flex-1 text-sm text-muted-foreground">{stageText.hint}</p>
              <Button
                data-teach={`start-${stage.id}`}
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => onSelect(first.kind)}
              >
                <Icon />
                {t("add", { label: first.label })}
              </Button>
            </li>
          );
        })}
      </ol>

      <LessonChooser mode="app" compact levels={["basics"]} />

      <Link
        href="/"
        className="flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-10"
      >
        <LayoutTemplate className="size-4" />
        {t("templates")}
      </Link>
    </section>
  );
}
