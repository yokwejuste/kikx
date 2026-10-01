import { FileWarning, PackagePlus, Save, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { Button } from "@/components/ui/button";
import { CodeList } from "@/components/common/code-list";
import type { FileConflict } from "@/lib/project/context";

export function SaveBar({
  isEditing,
  dirty,
  saving,
  conflicts,
  onSave,
  onReset,
}: {
  isEditing: boolean;
  dirty: boolean;
  saving: boolean;
  conflicts: FileConflict[];
  onSave: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("editor.saveBar");
  const text = useCatalogText();
  const owners = Array.from(new Set(conflicts.map((c) => text.describe(c.owner.recipe).title))).join(", ");
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {conflicts.length > 0 && (
        <p className="flex items-start gap-2 text-xs">
          <FileWarning className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t.rich("replaces", {
              owners,
              files: () => <CodeList items={conflicts.map((c) => c.fileName)} />,
            })}
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button data-teach="save" type="button" disabled={saving} onClick={onSave}>
          {isEditing ? <Save /> : <PackagePlus />}
          {saving ? t("rendering") : isEditing ? t("save") : t("add")}
        </Button>
        {dirty && (
          <Button type="button" variant="ghost" onClick={onReset}>
            <Undo2 />
            {isEditing ? t("discard") : t("reset")}
          </Button>
        )}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {isEditing && !dirty ? t("clean") : dirty ? t("draftKept") : t("shortcut")}
        </span>
      </div>
    </div>
  );
}
