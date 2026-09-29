import { Copy } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
import type { RenderedFile } from "@/lib/api/client";

export function FileContent({ file }: { file: RenderedFile }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{file.path}</span>
        <CopyButton
          text={file.content}
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="size-3.5" />
          Copy
        </CopyButton>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-relaxed">{file.content}</pre>
    </div>
  );
}
