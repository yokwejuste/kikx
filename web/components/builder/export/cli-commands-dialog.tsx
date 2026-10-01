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
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";
import { downloadPreset, presetFileName } from "@/lib/project/preset";
import { updateGettingStarted } from "@/lib/project/getting-started-store";

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
  components,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: ProjectDetails;
  components: AddedComponent[];
}) {
  const t = useTranslations("export.cli");
  const path = `./${presetFileName(details)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t.rich("needsPreset", { code: (chunks) => <code className="font-mono">{chunks}</code>, file: path })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <CommandLine command={`kikx setup ${path}`} />
          <CommandLine command={`kikx apply ${path}`} />
          <p className="text-xs text-muted-foreground">
            {t.rich("explain", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              downloadPreset(details, components);
              updateGettingStarted(details.name, { downloaded: true });
            }}
          >
            <Download />
            {t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
