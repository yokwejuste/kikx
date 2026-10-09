"use client";

import { useState } from "react";
import { PreviewIllustration } from "@/components/illustrations/illustrations";
import { FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";
import { FileContent } from "@/components/builder/preview/file-content";
import { DiffView } from "@/components/common/diff-view";
import type { RenderedFile } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";
import { Spinner } from "@/components/common/spinner";

export type PreviewStatus = "invalid" | "loading" | "ready" | "error";

export function YamlPreview({
  files,
  status,
  error,
  conflictPaths = new Set(),
  saved,
}: {
  files: RenderedFile[] | null;
  status: PreviewStatus;
  error?: string;
  conflictPaths?: Set<string>;
  saved?: Map<string, string>;
}) {
  const t = useTranslations("preview");
  const [active, setActive] = useState(0);
  const [showChanges, setShowChanges] = useState(false);

  if (!files || files.length === 0) {
    return (
      <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-5 text-center text-sm text-muted-foreground">
        {status === "loading" ? (
          <>
            <Spinner />
            {t("rendering")}
          </>
        ) : status === "error" ? (
          <span className="text-destructive">{error ?? t("failed")}</span>
        ) : (
          <>
            <PreviewIllustration className="h-14" />
            <span>{t("waiting")}</span>
          </>
        )}
      </div>
    );
  }

  const current = files[Math.min(active, files.length - 1)];
  const changed = (file: RenderedFile) => saved !== undefined && saved.get(file.path) !== file.content;
  const savedContent = saved?.get(current.path);

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
                index === active ? "bg-volt-soft text-volt-soft-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {conflictPaths.has(file.path) && <FileWarning className="size-3" />}
              {file.path}
              {changed(file) && <span aria-label={t("changed")} className="size-1.5 rounded-full bg-volt" />}
            </button>
          ))}
        </div>
      )}
      {saved && (
        <div role="radiogroup" aria-label={t("view")} className="flex gap-1 self-start rounded-md border p-0.5 text-xs">
          {([false, true] as const).map((changes) => (
            <button
              key={String(changes)}
              type="button"
              role="radio"
              aria-checked={showChanges === changes}
              onClick={() => setShowChanges(changes)}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                showChanges === changes ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {changes ? t("changes") : t("file")}
            </button>
          ))}
        </div>
      )}
      {saved && showChanges ? (
        savedContent === undefined ? (
          <Hint className="rounded-lg border border-dashed p-3">{t("newFile")}</Hint>
        ) : (
          <DiffView
            before={savedContent}
            after={current.content}
            className="max-h-file-preview overflow-auto rounded-lg border bg-muted/30 p-4"
          />
        )
      ) : (
        <FileContent file={current} />
      )}
      {status === "error" && error && <p className="text-xs text-destructive">{t("lastGood", { error })}</p>}
      {status === "invalid" && (
        <Hint>{t("invalid")}</Hint>
      )}
    </div>
  );
}
