"use client";

import { FolderCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ChecksClearIllustration, ChecksEmptyIllustration } from "@/components/illustrations/illustrations";
import { SEVERITY } from "@/components/builder/project/severity";
import type { AddedComponent } from "@/lib/project/context";
import type { ProjectIssue } from "@/lib/project/checks";
import { cn } from "@/lib/utils";

export function ChecksPanel({
  issues,
  components,
  onOpen,
  onScaffoldRoles,
}: {
  issues: ProjectIssue[];
  components: AddedComponent[];
  onOpen: (component: AddedComponent) => void;
  onScaffoldRoles: (roles: string[]) => void;
}) {
  const t = useTranslations("checks");
  const root = useTranslations();
  const text = useCatalogText();
  const byId = new Map(components.map((c) => [c.id, c]));

  if (components.length === 0) {
    return (
      <EmptyState className="h-64 gap-4">
        <ChecksEmptyIllustration className="h-24" />
        {t("empty")}
      </EmptyState>
    );
  }

  if (issues.length === 0) {
    return (
      <EmptyState className="h-64 gap-4">
        <ChecksClearIllustration className="h-24" />
        <p>{t("clear")}</p>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {t("intro")}
      </p>
      {(["error", "warning", "info"] as const).map((severity) => {
        const list = issues.filter((i) => i.severity === severity);
        if (list.length === 0) return null;
        const { icon: Icon, className } = SEVERITY[severity];
        return (
          <section key={severity} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Icon className={cn("size-4", className)} />
              {t(`severity.${severity}`)} <span className="text-muted-foreground tabular-nums">{list.length}</span>
            </h3>
            <ul className="flex flex-col divide-y rounded-xl border bg-card">
              {list.map((issue) => (
                <li key={issue.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">{root(issue.title.key, issue.title.values)}</p>
                      {issue.detail && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{root(issue.detail.key, issue.detail.values)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5 pl-7 sm:pl-0">
                    {issue.action?.type === "scaffold-roles" && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onScaffoldRoles(issue.action!.roles)}>
                        <FolderCog />
                        {t("scaffold", { count: issue.action.roles.length })}
                      </Button>
                    )}
                    {issue.componentIds
                      .filter((id, i, all) => all.indexOf(id) === i)
                      .map((id) => byId.get(id))
                      .filter((c): c is AddedComponent => !!c)
                      .map((component) => (
                        <Button key={component.id} type="button" variant="outline" size="sm" onClick={() => onOpen(component)}>
                          {t("open", { title: text.describe(component.recipe).title })}
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
