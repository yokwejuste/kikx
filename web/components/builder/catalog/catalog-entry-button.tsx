"use client";

import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CatalogEntryButton({
  icon: Icon,
  label,
  summary,
  writes,
  active,
  badge,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  summary: string;
  writes: string;
  active: boolean;
  badge?: ReactNode;
  onSelect: () => void;
}) {
  const summaryId = useId();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      aria-describedby={summaryId}
      title={summary}
      className={cn(
        "group flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors pointer-coarse:min-h-10",
        active
          ? "bg-volt-soft font-medium text-volt-soft-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        <span
          className={cn(
            "truncate font-mono text-[11px] leading-4 font-normal",
            active ? "text-volt-soft-foreground/70" : "text-muted-foreground/80 group-hover:text-muted-foreground",
          )}
        >
          {writes}
        </span>
      </span>
      <span id={summaryId} className="sr-only">
        {summary}
      </span>
      {badge}
    </button>
  );
}
