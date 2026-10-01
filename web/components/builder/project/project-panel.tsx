"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { EmptyProjectIllustration } from "@/components/illustrations/illustrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComponentRow } from "@/components/builder/project/component-row";
import { SEVERITY, type IssueCounts } from "@/components/builder/project/severity";
import { FileContent } from "@/components/builder/preview/file-content";
import { CATALOG, catalogStage, describeComponent } from "@/lib/registry/catalog";
import { useProject, type AddedComponent, type ProjectFile } from "@/lib/project/context";
import type { ProjectIssue } from "@/lib/project/checks";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";
import { SectionLabel } from "@/components/common/section-label";
import { codeTag } from "@/components/common/rich-tags";

export function ProjectPanel({
  activeId,
  issuesFor,
  issueCounts,
  onEdit,
  onShowChecks,
}: {
  activeId: string | null;
  issuesFor: Map<string, ProjectIssue[]>;
  issueCounts: IssueCounts;
  onEdit: (component: AddedComponent) => void;
  onShowChecks: () => void;
}) {
  const t = useTranslations("project");
  const text = useCatalogText();
  const { details, components } = useProject();
  const [viewing, setViewing] = useState<ProjectFile | null>(null);
  const fileCount = components.reduce((n, c) => n + c.files.length, 0);
  const AttentionIcon = SEVERITY[issueCounts.error > 0 ? "error" : "warning"].icon;

  const byStage = CATALOG.map((stage) => ({
    stage,
    items: components.filter((c) => catalogStage(describeComponent(c.recipe).kind).id === stage.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <Hint>
          {t.rich("summary", {
            components: components.length,
            files: fileCount,
            dir: `${details?.outputDir}/`,
            code: codeTag,
          })}
        </Hint>
        {(issueCounts.error > 0 || issueCounts.warning > 0) && (
          <button
            type="button"
            onClick={onShowChecks}
            className="mt-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs hover:bg-muted/50"
          >
            <AttentionIcon className={cn("size-3.5", issueCounts.error > 0 && SEVERITY.error.className)} />
            <span className="flex-1">
              {[
                issueCounts.error && t("errors", { count: issueCounts.error }),
                issueCounts.warning && t("warnings", { count: issueCounts.warning }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="text-muted-foreground">{t("review")}</span>
          </button>
        )}
      </div>

      <div className="max-h-panel-list overflow-auto p-2">
        {components.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-2 py-6 text-center text-sm text-muted-foreground">
            <EmptyProjectIllustration className="h-16" />
            <p>{t.rich("empty", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {byStage.map(({ stage, items }) => (
              <div key={stage.id}>
                <SectionLabel className="px-2 pb-1 text-3xs">
                  {text.stage(stage.id).label}
                </SectionLabel>
                <ul className="flex flex-col gap-0.5">
                  {items.map((component) => (
                    <ComponentRow
                      key={component.id}
                      component={component}
                      active={component.id === activeId}
                      issues={issuesFor.get(component.id)}
                      onEdit={() => onEdit(component)}
                      onView={setViewing}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{viewing?.fileName}</DialogTitle>
            <DialogDescription>{t("viewing", { component: viewing?.component ?? "" })}</DialogDescription>
          </DialogHeader>
          {viewing && <FileContent file={{ path: viewing.fileName, content: viewing.content }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
