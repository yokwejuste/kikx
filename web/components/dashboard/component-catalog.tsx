"use client";

import { CircleCheck } from "lucide-react";
import { CATALOG, catalogEntry, describeComponent, type CatalogKind } from "@/lib/component-catalog";
import type { AddedComponent } from "@/lib/project-context";
import { cn } from "@/lib/utils";

export function ComponentCatalog({
  components,
  selected,
  onSelect,
}: {
  components: AddedComponent[];
  selected: CatalogKind;
  onSelect: (kind: CatalogKind) => void;
}) {
  const counts = new Map<CatalogKind, number>();
  for (const c of components) {
    const { kind } = describeComponent(c.recipe);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  return (
    <nav aria-label="Components" className="flex flex-col gap-5">
      {CATALOG.map((stage, stageIndex) => {
        const stageCount = stage.entries.reduce((n, e) => n + (counts.get(e.kind) ?? 0), 0);
        return (
          <div key={stage.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  stageCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {stageCount > 0 ? <CircleCheck className="size-3" /> : stageIndex + 1}
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase">{stage.label}</span>
            </div>
            <p className="mb-1 px-2 pl-9 text-xs leading-snug text-muted-foreground">{stage.hint}</p>
            <ul className="flex flex-col">
              {stage.entries.map(({ kind }) => {
                const entry = catalogEntry(kind);
                const count = counts.get(entry.kind) ?? 0;
                const active = entry.kind === selected;
                const Icon = entry.icon;
                return (
                  <li key={entry.kind}>
                    <button
                      type="button"
                      onClick={() => onSelect(entry.kind)}
                      aria-current={active ? "true" : undefined}
                      title={entry.summary}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground tabular-nums">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
