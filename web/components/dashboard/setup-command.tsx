"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/project-context";
import { downloadPreset, presetFileName } from "@/lib/preset";

function CommandLine({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-between gap-2 overflow-hidden rounded-lg border bg-muted/30 py-2 pr-2 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-xs">{command}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => {
          navigator.clipboard.writeText(command);
          toast.success("Copied to clipboard");
        }}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

export function SetupCommand() {
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
          <code className="font-mono">setup</code> bootstraps a new kikx project from this file.{" "}
          <code className="font-mono">apply</code> vendors it into a project you already have —
          no kikx.toml, no backend required.
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
      Download preset
    </Button>
  );
}
