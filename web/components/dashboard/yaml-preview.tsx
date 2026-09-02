"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { RenderedFile } from "@/lib/api-client";

function FileBlock({ file }: { file: RenderedFile }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{file.path}</span>
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
      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed">{file.content}</pre>
    </div>
  );
}

export function YamlPreview({ files }: { files: RenderedFile[] | null }) {
  if (!files || files.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Click Preview to render this component.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => (
        <FileBlock key={file.path} file={file} />
      ))}
    </div>
  );
}
