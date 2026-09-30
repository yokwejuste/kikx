import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/common/help-tip";
import { KIND_TERMS } from "@/lib/glossary/terms";
import type { AddedComponent, ProjectFile } from "@/lib/project/context";
import type { ComponentKind } from "@/lib/registry/references";

export function EditorHeader({
  kind,
  editing,
  previewFiles,
  onStartNew,
}: {
  kind: ComponentKind;
  editing: AddedComponent | null;
  previewFiles: ProjectFile[] | null;
  onStartNew: () => void;
}) {
  const t = useTranslations("editor.header");
  const text = useCatalogText();
  const entry = text.entry(kind);
  const Icon = entry.icon;
  const writes = previewFiles?.length
    ? previewFiles.length === 1
      ? previewFiles[0].fileName
      : t("files", { count: previewFiles.length })
    : entry.writes;

  return (
    <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-volt-soft text-volt-soft-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">
            {editing
              ? t.rich("editing", {
                  label: entry.label,
                  title: text.describe(editing.recipe).title,
                  mono: (chunks) => <span className="font-mono">{chunks}</span>,
                })
              : t("new", { label: entry.label.toLowerCase() })}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{entry.summary}.</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HelpTip term={KIND_TERMS[kind]} />
        <Badge variant="secondary" className="max-w-56 truncate font-mono text-xs font-normal" title={writes}>
          → {writes}
        </Badge>
        {editing && (
          <Button type="button" variant="outline" size="sm" onClick={onStartNew}>
            <Plus />
            {t("startNew")}
          </Button>
        )}
      </div>
    </div>
  );
}
