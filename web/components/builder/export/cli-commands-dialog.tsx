"use client";

import { Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/common/copy-button";
import type { ProjectDetails } from "@/lib/project/context";
import { presetFileName } from "@/lib/project/preset";
import { Hint } from "@/components/common/hint";
import { codeTag } from "@/components/common/rich-tags";

function CommandLine({ command }: { command: string }) {
  const t = useTranslations("export.cli");
  return (
    <div className="terminal flex items-center justify-between gap-2 overflow-hidden rounded-lg border py-2 pr-2 pl-3">
      <code className="flex min-w-0 flex-1 gap-2 font-mono text-xs">
        <span aria-hidden className="terminal-prompt">
          $
        </span>
        <span className="min-w-0 truncate">{command}</span>
      </code>
      <CopyButton
        text={command}
        size="icon"
        aria-label={t("copy", { command })}
        className="size-6 text-(--terminal-paper)/60 hover:bg-(--terminal-paper)/10 hover:text-(--terminal-paper) dark:hover:bg-(--terminal-paper)/10"
      >
        <Copy className="size-3.5" />
      </CopyButton>
    </div>
  );
}

export function CliCommandsDialog({
  open,
  onOpenChange,
  details,
  onDownloadPreset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: ProjectDetails;
  onDownloadPreset: () => void;
}) {
  const t = useTranslations("export.cli");
  const path = `./${presetFileName(details)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t.rich("needsPreset", { code: codeTag, file: path })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <CommandLine command={`kikx setup ${path}`} />
          <CommandLine command={`kikx apply ${path}`} />
          <Hint>
            {t.rich("explain", { code: codeTag })}
          </Hint>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDownloadPreset}>
            <Download />
            {t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
