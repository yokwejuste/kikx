import { FileWarning, PackagePlus, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeList } from "@/components/common/code-list";
import { describeComponent } from "@/lib/registry/catalog";
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
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {conflicts.length > 0 && (
        <p className="flex items-start gap-2 text-xs">
          <FileWarning className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Saving replaces <CodeList items={conflicts.map((c) => c.fileName)} /> — currently from{" "}
            {Array.from(new Set(conflicts.map((c) => describeComponent(c.owner.recipe).title))).join(", ")}.
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={saving} onClick={onSave}>
          {isEditing ? <Save /> : <PackagePlus />}
          {saving ? "Rendering…" : isEditing ? "Save changes" : "Add to project"}
        </Button>
        {dirty && (
          <Button type="button" variant="ghost" onClick={onReset}>
            <Undo2 />
            {isEditing ? "Discard changes" : "Reset"}
          </Button>
        )}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {isEditing && !dirty
            ? "No unsaved changes"
            : dirty
              ? "Draft kept in this browser · ⌘/Ctrl + Enter to save"
              : "⌘/Ctrl + Enter to save"}
        </span>
      </div>
    </div>
  );
}
