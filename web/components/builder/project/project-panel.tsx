"use client";

import { useState } from "react";
import { EmptyProjectIllustration } from "@/components/illustrations/illustrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComponentRow } from "@/components/builder/project/component-row";
import { SetupCommand } from "@/components/builder/project/setup-command";
import { SEVERITY, type IssueCounts } from "@/components/builder/project/severity";
import { FileContent } from "@/components/builder/preview/file-content";
import { CATALOG, catalogStage, describeComponent } from "@/lib/registry/catalog";
import { useProject, type AddedComponent, type ProjectFile } from "@/lib/project/context";
import type { ProjectIssue } from "@/lib/project/checks";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

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
        <h2 className="text-sm font-medium">Project</h2>
        <p className="text-xs text-muted-foreground">
          {pluralize(components.length, "component")} · {pluralize(fileCount, "file")} in <code className="font-mono">{details?.outputDir}/</code>
        </p>
        {(issueCounts.error > 0 || issueCounts.warning > 0) && (
          <button
            type="button"
            onClick={onShowChecks}
            className="mt-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs hover:bg-muted/50"
          >
            <AttentionIcon className={cn("size-3.5", issueCounts.error > 0 && SEVERITY.error.className)} />
            <span className="flex-1">
              {[
                issueCounts.error && pluralize(issueCounts.error, "error"),
                issueCounts.warning && pluralize(issueCounts.warning, "warning"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="text-muted-foreground">Review</span>
          </button>
        )}
      </div>

      <div className="max-h-[60vh] overflow-auto p-2">
        {components.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-2 py-6 text-center text-sm text-muted-foreground">
            <EmptyProjectIllustration className="h-16" />
            <p>
              Nothing yet. Most projects start with an <span className="font-medium text-foreground">Inventory</span>.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {byStage.map(({ stage, items }) => (
              <div key={stage.id}>
                <p className="px-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {stage.label}
                </p>
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

      {components.length > 0 && (
        <div className="border-t p-3">
          <SetupCommand />
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{viewing?.fileName}</DialogTitle>
            <DialogDescription>Rendered by {viewing?.component}. Edit the component to change it.</DialogDescription>
          </DialogHeader>
          {viewing && <FileContent file={{ path: viewing.fileName, content: viewing.content }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
