"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiClientError, setupCommandFor } from "@/lib/api-client";
import { useProject } from "@/lib/project-context";

export function SetupCommand() {
  const { details, files } = useProject();
  const [command, setCommand] = useState<string | null>(null);

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!details) throw new Error("no project details yet");
      return api.publishProject({
        details,
        files: files.map((f) => ({ fileName: f.fileName, component: f.component, content: f.content })),
      });
    },
    onSuccess: (data) => setCommand(setupCommandFor(data.id)),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to publish project");
    },
  });

  if (command) {
    return (
      <div className="flex flex-col gap-2">
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
        <p className="text-xs text-muted-foreground">
          Run this on your machine while this backend is running — it writes the project
          straight to disk, same as the zip.
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={files.length === 0 || publishMutation.isPending}
      onClick={() => publishMutation.mutate()}
    >
      <Terminal className="size-4" />
      {publishMutation.isPending ? "Publishing…" : "Get CLI command"}
    </Button>
  );
}
