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
import type { FileConflict } from "@/lib/project/context";
import { cn } from "@/lib/utils";

function ConflictRow({ conflict }: { conflict: FileConflict }) {
  const t = useTranslations("conflicts");
  const text = useCatalogText();
  const [open, setOpen] = useState(false);
  const owner = text.describe(conflict.owner.recipe);
  const identical = conflict.existingContent === conflict.incomingContent;

  return (
    <li className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
        aria-expanded={open}
      >
        <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{conflict.fileName}</code>
        <span className="shrink-0 text-xs text-muted-foreground">
          {identical ? t("same") : t("differs")}
        </span>
      </button>
      <p className="px-3 pb-2 pl-8 text-xs text-muted-foreground">
        {t.rich("writtenBy", {
          kind: owner.kindLabel,
          title: owner.title,
          strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
        })}
      </p>
      {open && (
        <div className="grid gap-2 border-t p-2 sm:grid-cols-2">
          {(
            [
              [t("current"), conflict.existingContent],
              [t("incoming"), conflict.incomingContent],
            ] as const
          ).map(([label, content]) => (
            <div key={label} className="min-w-0 overflow-hidden rounded-md border bg-muted/30">
              <div className="border-b bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">{label}</div>
              <pre className="max-h-56 overflow-auto p-2 font-mono text-[11px] leading-relaxed">{content}</pre>
            </div>
          ))}
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="size-4" />
            {t("title", { count })}
          </DialogTitle>
          <DialogDescription>
            {t("body", { count })}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-[50vh] flex-col gap-2 overflow-auto">
          {conflicts?.map((conflict) => (
            <ConflictRow key={`${conflict.owner.id}:${conflict.fileName}`} conflict={conflict} />
          ))}
        </ul>

        {collateral.length > 0 && (
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            {t.rich("collateral", {
              count: owners.size,
              files: () => <CodeList items={collateral} className="text-foreground" />,
            })}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
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
