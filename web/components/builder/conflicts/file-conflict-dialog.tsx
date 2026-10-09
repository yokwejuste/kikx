"use client";

import { useState } from "react";
import { ChevronRight, FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeList } from "@/components/common/code-list";
import { CodeView } from "@/components/common/code-view";
import { DiffView } from "@/components/common/diff-view";
import type { FileConflict } from "@/lib/project/context";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";

function ConflictRow({ conflict }: { conflict: FileConflict }) {
  const t = useTranslations("conflicts");
  const text = useCatalogText();
  const [open, setOpen] = useState(false);
  const owner = text.describe(conflict.owner.recipe);
  const identical = conflict.existingContent === conflict.incomingContent;

  return (
    <li className="rounded-lg border">
      <button
        data-teach="conflict-file"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
        aria-expanded={open}
      >
        <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{conflict.fileName}</code>
        <Hint as="span" className="shrink-0">
          {identical ? t("same") : t("differs")}
        </Hint>
      </button>
      <Hint className="px-3 pb-2 pl-8">
        {t.rich("writtenBy", {
          kind: owner.kindLabel,
          title: owner.title,
          strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
        })}
      </Hint>
      {open && (
        <div data-teach="conflict-diff" className="border-t p-2">
          {identical ? (
            <CodeView
              code={conflict.incomingContent}
              path={conflict.fileName}
              className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-2 font-mono text-2xs leading-relaxed"
            />
          ) : (
            <>
              <Hint className="flex gap-3 px-1 pb-1.5">
                <span className="text-destructive">− {t("current")}</span>
                <span>+ {t("incoming")}</span>
              </Hint>
              <DiffView
                before={conflict.existingContent}
                after={conflict.incomingContent}
                className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-2"
              />
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function FileConflictDialog({
  conflicts,
  onCancel,
  onConfirm,
}: {
  conflicts: FileConflict[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const owners = new Map((conflicts ?? []).map((c) => [c.owner.id, c.owner]));
  const clashing = new Set((conflicts ?? []).map((c) => c.fileName));
  const collateral = Array.from(owners.values()).flatMap((owner) =>
    owner.files.map((f) => f.fileName).filter((fileName) => !clashing.has(fileName)),
  );
  const t = useTranslations("conflicts");
  const count = conflicts?.length ?? 0;

  return (
    <Dialog open={!!conflicts?.length} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-teach="conflict-dialog" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="size-4" />
            {t("title", { count })}
          </DialogTitle>
          <DialogDescription>
            {t("body", { count })}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-dialog-list flex-col gap-2 overflow-auto">
          {conflicts?.map((conflict) => (
            <ConflictRow key={`${conflict.owner.id}:${conflict.fileName}`} conflict={conflict} />
          ))}
        </ul>

        {collateral.length > 0 && (
          <Hint className="rounded-lg border border-dashed p-3">
            {t.rich("collateral", {
              count: owners.size,
              files: () => <CodeList items={collateral} className="text-foreground" />,
            })}
          </Hint>
        )}

        <DialogFooter>
          <Button data-teach="conflict-keep" variant="outline" onClick={onCancel}>
            {t("keep")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("replace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
