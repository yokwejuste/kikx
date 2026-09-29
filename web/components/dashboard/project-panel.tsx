"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, CircleAlert, FileCode2, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetupCommand } from "@/components/dashboard/setup-command";
import { FileContent } from "@/components/dashboard/yaml-preview";
import { CATALOG, catalogStage, describeComponent } from "@/lib/component-catalog";
import { useProject, type AddedComponent, type ProjectFile } from "@/lib/project-context";
import type { ProjectIssue } from "@/lib/project-checks";
import { cn } from "@/lib/utils";

function IssueMark({ issues }: { issues: ProjectIssue[] | undefined }) {
  if (!issues?.length) return null;
  const error = issues.some((i) => i.severity === "error");
  const warning = issues.some((i) => i.severity === "warning");
  if (!error && !warning) return null;
  const Icon = error ? CircleAlert : TriangleAlert;
  return (
    <Icon
      aria-label={`${issues.length} issue${issues.length > 1 ? "s" : ""}`}
      className={cn("size-3.5 shrink-0", error ? "text-destructive" : "text-foreground")}
    />
  );
}

function ComponentRow({
  component,
  active,
  issues,
  onEdit,
  onView,
}: {
  component: AddedComponent;
  active: boolean;
  issues: ProjectIssue[] | undefined;
  onEdit: () => void;
  onView: (file: ProjectFile) => void;
}) {
  const { removeComponent, restoreComponent } = useProject();
  const [open, setOpen] = useState(false);
  const { icon: Icon, title, kindLabel } = describeComponent(component.recipe);

  return (
    <li className={cn("group rounded-lg", active && "bg-muted")}>
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          aria-label={open ? "Hide files" : "Show files"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          title={`Edit ${title}`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left hover:text-foreground"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-xs">{title}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {kindLabel} · {component.files.length} file{component.files.length === 1 ? "" : "s"}
            </span>
          </span>
          <IssueMark issues={issues} />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${title}`}
          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
          onClick={() => {
            const removed = removeComponent(component.id);
            if (!removed) return;
            toast(`Removed ${title}`, {
              action: { label: "Undo", onClick: () => restoreComponent(removed) },
            });
          }}
        >
          <Trash2 />
        </Button>
      </div>
      {open && (
        <ul className="mb-1 ml-7 flex flex-col border-l pl-2">
          {component.files.map((file) => (
            <li key={file.fileName}>
              <button
                type="button"
                onClick={() => onView(file)}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <FileCode2 className="size-3.5 shrink-0" />
                <span className="truncate font-mono text-[11px]">{file.fileName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function ProjectPanel({
  activeId,
  issuesFor,
  issueCounts,
  onEdit,
  onShowChecks,
}: {
  activeId: string | null;
  issuesFor: Map<string, ProjectIssue[]>;
  issueCounts: { error: number; warning: number; info: number };
  onEdit: (component: AddedComponent) => void;
  onShowChecks: () => void;
}) {
  const { details, components } = useProject();
  const [viewing, setViewing] = useState<ProjectFile | null>(null);
  const fileCount = components.reduce((n, c) => n + c.files.length, 0);

  const byStage = CATALOG.map((stage) => ({
    stage,
    items: components.filter((c) => catalogStage(describeComponent(c.recipe).kind).id === stage.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">Project</h2>
        <p className="text-xs text-muted-foreground">
          {components.length} component{components.length === 1 ? "" : "s"} · {fileCount} file{fileCount === 1 ? "" : "s"}{" "}
          in <code className="font-mono">{details?.outputDir}/</code>
        </p>
        {(issueCounts.error > 0 || issueCounts.warning > 0) && (
          <button
            type="button"
            onClick={onShowChecks}
            className="mt-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs hover:bg-muted/50"
          >
            {issueCounts.error > 0 ? (
              <CircleAlert className="size-3.5 text-destructive" />
            ) : (
              <TriangleAlert className="size-3.5" />
            )}
            <span className="flex-1">
              {[
                issueCounts.error && `${issueCounts.error} error${issueCounts.error > 1 ? "s" : ""}`,
                issueCounts.warning && `${issueCounts.warning} warning${issueCounts.warning > 1 ? "s" : ""}`,
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
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing yet. Most projects start with an <span className="font-medium text-foreground">Inventory</span>.
          </p>
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
