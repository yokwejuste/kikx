"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function YamlPreview({ rendered }: { rendered: string | null }) {
  if (!rendered) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Click Preview to render the YAML for this component.
      </div>
    );
  }

  return (
    <div className="relative">
      <pre className="max-h-96 overflow-auto rounded-md border bg-muted p-4 font-mono text-xs leading-relaxed">
        {rendered}
      </pre>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => {
          navigator.clipboard.writeText(rendered);
          toast.success("Copied to clipboard");
        }}
      >
        Copy
      </Button>
    </div>
  );
}
