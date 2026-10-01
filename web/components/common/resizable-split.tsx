"use client";

import { useRef } from "react";
import { clampSplit, splitFromKey } from "@/lib/dom/split";
import { saveSplit, useStoredSplit } from "@/lib/dom/use-stored-split";
import { cn } from "@/lib/utils";

const MIN_PANE_PX = 384;

export function ResizableSplit({
  storageKey,
  label,
  start,
  end,
  className,
}: {
  storageKey: string;
  label: string;
  start: React.ReactNode;
  end: React.ReactNode;
  className?: string;
}) {
  const ratio = useStoredSplit(storageKey);
  const container = useRef<HTMLDivElement>(null);

  const resize = (next: number) => {
    const width = container.current?.getBoundingClientRect().width ?? 0;
    saveSplit(storageKey, clampSplit(next, width, MIN_PANE_PX));
  };

  return (
    <div
      ref={container}
      style={{ "--split": `${ratio * 100}%` } as React.CSSProperties}
      className={cn("grid gap-4 lg:grid-cols-[minmax(0,var(--split))_auto_minmax(0,1fr)] lg:gap-0", className)}
    >
      {start}
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        title={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        className="group hidden w-4 cursor-col-resize touch-none items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={(event) => {
          const rect = container.current?.getBoundingClientRect();
          if (!rect || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          resize((event.clientX - rect.left) / rect.width);
        }}
        onKeyDown={(event) => {
          const next = splitFromKey(event.key, ratio);
          if (next === null) return;
          event.preventDefault();
          resize(next);
        }}
      >
        <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-muted-foreground group-focus-visible:bg-ring" />
      </div>
      {end}
    </div>
  );
}
