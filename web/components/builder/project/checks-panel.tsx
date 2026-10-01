"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/empty-state";
import { ChecksClearIllustration, ChecksEmptyIllustration } from "@/components/illustrations/illustrations";
import { SEVERITY } from "@/components/builder/project/severity";
import { IssueRow, type IssueActions } from "@/components/builder/project/issue-row";
import type { AddedComponent } from "@/lib/project/context";
import type { ProjectIssue } from "@/lib/project/checks";
import { cn } from "@/lib/utils";

export function ChecksPanel({
  issues,
  components,
  onOpen,
  onScaffoldRoles,
}: IssueActions & {
  issues: ProjectIssue[];
  components: AddedComponent[];
}) {
  const t = useTranslations("checks");

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
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  onOpen={onOpen}
                  onScaffoldRoles={onScaffoldRoles}
                  className="p-4"
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
