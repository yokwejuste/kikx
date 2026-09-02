"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function YamlPreview({ rendered }: { rendered: string | null }) {
  if (!rendered) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Click Preview to render the YAML for this component.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">preview.yaml</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator.clipboard.writeText(rendered);
            toast.success("Copied to clipboard");
          }}
        >
          <Copy className="size-3.5" />
          Copy
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed">{rendered}</pre>
    </div>
  );
}
