"use client";

import { FolderCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { Button } from "@/components/ui/button";
import { SEVERITY } from "@/components/builder/project/severity";
import { useProject, type AddedComponent } from "@/lib/project/context";
import type { ProjectIssue } from "@/lib/project/checks";
import { cn } from "@/lib/utils";

export interface IssueActions {
  onOpen: (component: AddedComponent) => void;
  onScaffoldRoles: (roles: string[]) => void;
}

export function IssueRow({
  issue,
  onOpen,
  onScaffoldRoles,
  currentId,
  className,
}: IssueActions & { issue: ProjectIssue; currentId?: string; className?: string }) {
  const t = useTranslations("checks");
  const root = useTranslations();
  const text = useCatalogText();
  const { components } = useProject();
  const { icon: Icon, className: tone } = SEVERITY[issue.severity];
  const linked = Array.from(new Set(issue.componentIds))
    .filter((id) => id !== currentId)
    .map((id) => components.find((c) => c.id === id))
    .filter((c): c is AddedComponent => !!c);
  const action = issue.action;

  return (
    <li data-teach="issue-row" className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex min-w-0 gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} />
        <div className="min-w-0">
          <p className="text-sm font-medium break-words">{root(issue.title.key, issue.title.values)}</p>
          {issue.detail && (
            <p className="mt-0.5 text-sm text-muted-foreground">{root(issue.detail.key, issue.detail.values)}</p>
          )}
        </div>
      </div>
      {(action || linked.length > 0) && (
        <div className="flex shrink-0 flex-wrap gap-1.5 pl-7 sm:pl-0">
          {action?.type === "scaffold-roles" && (
            <Button data-teach="issue-scaffold" type="button" variant="secondary" size="sm" onClick={() => onScaffoldRoles(action.roles)}>
              <FolderCog />
              {t("scaffold", { count: action.roles.length })}
            </Button>
          )}
          {linked.map((component) => (
            <Button data-teach="issue-open" key={component.id} type="button" variant="outline" size="sm" onClick={() => onOpen(component)}>
              {t("open", { title: text.describe(component.recipe).title })}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}
