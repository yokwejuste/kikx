"use client";

import { structuredPatch } from "diff";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";

export function DiffView({ before, after, className }: { before: string; after: string; className?: string }) {
  const t = useTranslations("diff");
  const { hunks } = structuredPatch("", "", before, after, "", "", { context: 3 });

  if (hunks.length === 0) return <Hint className="p-2">{t("none")}</Hint>;

  return (
    <pre className={cn("font-mono text-2xs leading-relaxed", className)}>
      <code>
        {hunks.map((hunk) => (
          <span key={`${hunk.oldStart}:${hunk.newStart}`} className="block">
            <span className="block text-muted-foreground">
              {`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`}
            </span>
            {hunk.lines.map((line, index) => (
              <span
                key={index}
                className={cn(
                  "block",
                  line.startsWith("+") && "bg-volt-soft text-volt-soft-foreground",
                  line.startsWith("-") && "bg-destructive/15 text-destructive",
                )}
              >
                {line}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
}
