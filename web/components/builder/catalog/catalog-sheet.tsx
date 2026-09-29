"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ComponentCatalog } from "@/components/builder/catalog/component-catalog";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import type { CatalogKind } from "@/lib/registry/catalog";
import type { AddedComponent } from "@/lib/project/context";

export function CatalogSheet({
  components,
  selected,
  onSelect,
}: {
  components: AddedComponent[];
  selected: CatalogKind;
  onSelect: (kind: CatalogKind) => void;
}) {
  const t = useTranslations("catalog");
  const text = useCatalogText();
  const [open, setOpen] = useState(false);
  const entry = text.entry(selected);
  const Icon = entry.icon;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" data-tour="catalog" className="w-full justify-start gap-2 pointer-coarse:h-10">
          <PanelLeftOpen className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t("nav")}</span>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Icon className="size-4" />
          <span className="min-w-0 truncate">{entry.label}</span>
        </Button>
      </SheetTrigger>
      <SheetContent closeLabel={t("close")}>
        <SheetTitle className="pr-10">{t("nav")}</SheetTitle>
        <ComponentCatalog
          components={components}
          selected={selected}
          onSelect={(kind) => {
            onSelect(kind);
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
