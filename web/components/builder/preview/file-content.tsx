"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { CodeView } from "@/components/common/code-view";
import { CopyButton } from "@/components/common/copy-button";
import type { RenderedFile } from "@/lib/api/client";
import { Hint } from "@/components/common/hint";

export function FileContent({ file }: { file: RenderedFile }) {
  const t = useTranslations("preview");
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-1.5">
        <Hint as="span" className="truncate font-mono">{file.path}</Hint>
        <CopyButton
          text={file.content}
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="size-3.5" />
          {t("copy")}
        </CopyButton>
      </div>
      <CodeView
        code={file.content}
        path={file.path}
        className="max-h-file-preview overflow-auto p-4 font-mono text-xs leading-relaxed"
      />
    </div>
  );
}
