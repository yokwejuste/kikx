"use client";

import { useState, type ComponentProps } from "react";
import { PanelRightOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProjectPanel } from "@/components/builder/project/project-panel";
import { GettingStarted } from "@/components/builder/project/getting-started";
import type { CatalogKind } from "@/lib/registry/catalog";
import { useProject } from "@/lib/project/context";

export function ProjectSheet({
  onEdit,
  onShowChecks,
  onSelect,
  ...panel
}: ComponentProps<typeof ProjectPanel> & { onSelect: (kind: CatalogKind) => void }) {
  const t = useTranslations("project");
  const { components } = useProject();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" data-tour="project" className="gap-2">
          <PanelRightOpen className="size-4 text-muted-foreground" />
          {t("open", { count: components.length })}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel={t("close")} className="w-[min(24rem,90vw)] pt-12">
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <GettingStarted
          issueCounts={panel.issueCounts}
          onSelect={(kind) => {
            onSelect(kind);
            setOpen(false);
          }}
          onShowChecks={() => {
            onShowChecks();
            setOpen(false);
          }}
        />
        <ProjectPanel
          {...panel}
          onEdit={(component) => {
            onEdit(component);
            setOpen(false);
          }}
          onShowChecks={() => {
            onShowChecks();
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
