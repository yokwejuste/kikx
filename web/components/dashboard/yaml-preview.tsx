"use client";

import { useState } from "react";
import { Copy, FileWarning, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { RenderedFile } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type PreviewStatus = "invalid" | "loading" | "ready" | "error";

export function FileContent({ file, className }: { file: RenderedFile; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-muted/30", className)}>
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{file.path}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator.clipboard.writeText(file.content);
            toast.success("Copied to clipboard");
          }}
        >
          <Copy className="size-3.5" />
          Copy
        </Button>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-relaxed">{file.content}</pre>
    </div>
  );
}

export function YamlPreview({
  files,
  status,
  error,
  conflictPaths = new Set(),
}: {
  files: RenderedFile[] | null;
  status: PreviewStatus;
  error?: string;
  conflictPaths?: Set<string>;
}) {
  const [active, setActive] = useState(0);

  if (!files || files.length === 0) {
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
        {status === "loading" ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Rendering…
          </>
        ) : status === "error" ? (
          <span className="text-destructive">{error ?? "Couldn't render this component."}</span>
        ) : (
          <span>The preview appears as soon as the required fields are filled in.</span>
        )}
      </div>
    );
  }

  const current = files[Math.min(active, files.length - 1)];

  return (
    <div className={cn("flex flex-col gap-2 transition-opacity", status === "loading" && "opacity-70")}>
      {files.length > 1 && (
        <div role="tablist" className="flex flex-wrap gap-1">
          {files.map((file, index) => (
            <button
              key={file.path}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs transition-colors",
                index === active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {conflictPaths.has(file.path) && <FileWarning className="size-3" />}
              {file.path}
            </button>
          ))}
        </div>
      )}
      <FileContent file={current} />
      {status === "error" && error && <p className="text-xs text-destructive">{error} — showing the last good render.</p>}
      {status === "invalid" && (
        <p className="text-xs text-muted-foreground">Some fields are incomplete — showing the last valid render.</p>
      )}
    </div>
  );
}
