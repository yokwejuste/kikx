"use client";

import { useId, useState } from "react";
import { ChevronDown, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { CatalogEntryButton } from "@/components/builder/catalog/catalog-entry-button";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { CATALOG, catalogStage, describeComponent, type CatalogKind, type StageId } from "@/lib/registry/catalog";
import type { AddedComponent } from "@/lib/project/context";
import { cn } from "@/lib/utils";

const OPEN_STAGES_KEY = "kikx:catalog:stages";

type OpenStages = Partial<Record<StageId, boolean>>;

function readOpenStages(): OpenStages {
  try {
    return JSON.parse(window.localStorage.getItem(OPEN_STAGES_KEY) ?? "{}") as OpenStages;
  } catch {
    return {};
  }
}

function writeOpenStages(stages: OpenStages) {
  try {
    window.localStorage.setItem(OPEN_STAGES_KEY, JSON.stringify(stages));
  } catch {}
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="rounded-full bg-volt-soft px-1.5 text-[10px] font-medium text-volt-soft-foreground tabular-nums">
      {count}
    </span>
  );
}

export function ComponentCatalog({
  components,
  selected,
  onSelect,
}: {
  components: AddedComponent[];
  selected: CatalogKind;
  onSelect: (kind: CatalogKind) => void;
}) {
  const t = useTranslations("catalog");
  const text = useCatalogText();
  const baseId = useId();
  const selectedStage = catalogStage(selected).id;
  const [openStages, setOpenStages] = useState<OpenStages>(() => ({ ...readOpenStages(), [selectedStage]: true }));
  const [seenStage, setSeenStage] = useState(selectedStage);
  if (seenStage !== selectedStage) {
    setSeenStage(selectedStage);
    setOpenStages((current) => ({ ...current, [selectedStage]: true }));
  }

  const toggle = (id: StageId) =>
    setOpenStages((current) => {
      const next = { ...current, [id]: !(current[id] ?? false) };
      writeOpenStages(next);
      return next;
    });

  const counts = new Map<CatalogKind, number>();
  for (const c of components) {
    const { kind } = describeComponent(c.recipe);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  return (
    <nav aria-label={t("nav")} className="flex flex-col gap-3">
      {CATALOG.map((stage, stageIndex) => {
        const stageCount = stage.entries.reduce((n, e) => n + (counts.get(e.kind) ?? 0), 0);
        const stageText = text.stage(stage.id);
        const open = openStages[stage.id] ?? false;
        const panelId = `${baseId}-${stage.id}`;
        return (
          <div key={stage.id} className="flex flex-col gap-1">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(stage.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-muted/50 pointer-coarse:min-h-10"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  stageCount > 0 ? "bg-volt-soft text-volt-soft-foreground ring-1 ring-brand/40" : "bg-muted text-muted-foreground",
                )}
              >
                {stageCount > 0 ? <CircleCheck className="size-3" /> : stageIndex + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide uppercase">{stageText.label}</span>
              <CountBadge count={stageCount} />
              <ChevronDown
                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
              />
            </button>
            <div id={panelId} hidden={!open}>
              <p className="mb-1 px-2 pl-9 text-xs leading-snug text-muted-foreground">{stageText.hint}</p>
              <ul className="flex flex-col">
                {stage.entries.map(({ kind }) => {
                  const entry = text.entry(kind);
                  const count = counts.get(entry.kind) ?? 0;
                  const active = entry.kind === selected;
                  return (
                    <li key={entry.kind}>
                      <CatalogEntryButton
                        icon={entry.icon}
                        label={entry.label}
                        summary={entry.summary}
                        writes={entry.writes}
                        active={active}
                        badge={<CountBadge count={count} />}
                        onSelect={() => onSelect(entry.kind)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
