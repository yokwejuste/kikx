"use client";

import { useTranslations } from "next-intl";
import { IssueRow, type IssueActions } from "@/components/builder/project/issue-row";
import type { ProjectIssue } from "@/lib/project/checks";

export interface EditorChecks extends IssueActions {
  issues: ProjectIssue[];
}

export function EditorIssues({ checks, currentId }: { checks: EditorChecks; currentId: string }) {
  const t = useTranslations("editor.checks");
  if (checks.issues.length === 0) return null;

  return (
    <section data-teach="editor-issues" className="border-b bg-muted/40 px-6 py-3">
      <h3 className="text-xs font-medium text-muted-foreground">{t("title", { count: checks.issues.length })}</h3>
      <ul className="mt-2 flex flex-col gap-3">
        {checks.issues.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            currentId={currentId}
            onOpen={checks.onOpen}
            onScaffoldRoles={checks.onScaffoldRoles}
          />
        ))}
      </ul>
    </section>
  );
}
