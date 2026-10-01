"use client";

import { Download } from "lucide-react";
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
import { PromptLine, TerminalCopyButton } from "@/components/common/terminal";
import type { ProjectDetails } from "@/lib/project/context";
import { presetFileName } from "@/lib/project/preset";
import { Hint } from "@/components/common/hint";
import { codeTag } from "@/components/common/rich-tags";

function CommandLine({ command }: { command: string }) {
  const t = useTranslations("export.cli");
  return (
    <div className="terminal flex items-center justify-between gap-2 overflow-hidden rounded-lg border py-2 pr-2 pl-3 font-mono text-xs">
      <PromptLine className="min-w-0 flex-1">
        <code className="min-w-0 truncate">{command}</code>
      </PromptLine>
      <TerminalCopyButton text={command} label={t("copy", { command })} className="size-6" />
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
