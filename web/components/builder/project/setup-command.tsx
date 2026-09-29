"use client";

import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/common/copy-button";
import { useProject } from "@/lib/project/context";
import { downloadPreset, presetFileName } from "@/lib/project/preset";

function CommandLine({ command }: { command: string }) {
  const t = useTranslations("setup");
  return (
    <div className="flex items-center justify-between gap-2 overflow-hidden rounded-lg border bg-muted/30 py-2 pr-2 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-xs">{command}</code>
      <CopyButton
        text={command}
        size="icon"
        aria-label={t("copy", { command })}
        className="size-6 text-muted-foreground hover:text-foreground"
      >
        <Copy className="size-3.5" />
      </CopyButton>
    </div>
  );
}

export function SetupCommand() {
  const t = useTranslations("setup");
  const { details, components } = useProject();
  const [downloaded, setDownloaded] = useState(false);

  if (!details) return null;

  if (downloaded) {
    const path = `./${presetFileName(details)}`;
    return (
      <div className="flex flex-col gap-2">
        <CommandLine command={`kikx setup ${path}`} />
        <CommandLine command={`kikx apply ${path}`} />
        <p className="text-xs text-muted-foreground">
          {t.rich("explain", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={components.length === 0}
      onClick={() => {
        downloadPreset(details, components);
        setDownloaded(true);
      }}
    >
      <Download className="size-4" />
      {t("download")}
    </Button>
  );
}
