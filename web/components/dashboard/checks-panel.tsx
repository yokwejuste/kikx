"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeComponent } from "@/lib/component-catalog";
import type { AddedComponent } from "@/lib/project-context";
import type { IssueSeverity, ProjectIssue } from "@/lib/project-checks";
import { cn } from "@/lib/utils";

const SEVERITY: Record<IssueSeverity, { label: string; icon: typeof Info; className: string }> = {
  error: { label: "Errors", icon: CircleAlert, className: "text-destructive" },
  warning: { label: "Warnings", icon: TriangleAlert, className: "text-foreground" },
  info: { label: "Notes", icon: Info, className: "text-muted-foreground" },
};

export function ChecksPanel({
  issues,
  components,
  onOpen,
}: {
  issues: ProjectIssue[];
  components: AddedComponent[];
  onOpen: (component: AddedComponent) => void;
}) {
  const byId = new Map(components.map((c) => [c.id, c]));

  if (components.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add components and kikx will check how they fit together.
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
        <CircleCheck className="size-5 text-foreground" />
        <p>No conflicts found — hosts, groups, playbooks and manifests all line up.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        kikx cross-checks components against each other: duplicate files, hosts with two addresses, host vars that
        silently override group vars, plays aimed at groups that don&apos;t exist, and more. Errors break the output;
        warnings are likely mistakes; notes are just good to know.
      </p>
      {(["error", "warning", "info"] as const).map((severity) => {
        const list = issues.filter((i) => i.severity === severity);
        if (list.length === 0) return null;
        const { label, icon: Icon, className } = SEVERITY[severity];
        return (
          <section key={severity} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Icon className={cn("size-4", className)} />
              {label} <span className="text-muted-foreground tabular-nums">{list.length}</span>
            </h3>
            <ul className="flex flex-col divide-y rounded-xl border bg-card">
              {list.map((issue) => (
                <li key={issue.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">{issue.title}</p>
                      {issue.detail && <p className="mt-0.5 text-sm text-muted-foreground">{issue.detail}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5 pl-7 sm:pl-0">
                    {issue.componentIds
                      .filter((id, i, all) => all.indexOf(id) === i)
                      .map((id) => byId.get(id))
                      .filter((c): c is AddedComponent => !!c)
                      .map((component) => (
                        <Button key={component.id} type="button" variant="outline" size="sm" onClick={() => onOpen(component)}>
                          Open {describeComponent(component.recipe).title}
                        </Button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
