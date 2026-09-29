"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, FileCode2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEVERITY } from "@/components/builder/project/severity";
import { describeComponent } from "@/lib/registry/catalog";
import { useProject, type AddedComponent, type ProjectFile } from "@/lib/project/context";
import type { ProjectIssue } from "@/lib/project/checks";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

function IssueMark({ issues }: { issues: ProjectIssue[] | undefined }) {
  const worst = (["error", "warning"] as const).find((severity) => issues?.some((i) => i.severity === severity));
  if (!worst || !issues) return null;
  const { icon: Icon, className } = SEVERITY[worst];
  return <Icon aria-label={pluralize(issues.length, "issue")} className={cn("size-3.5 shrink-0", className)} />;
}

export function ComponentRow({
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
              {kindLabel} · {pluralize(component.files.length, "file")}
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
