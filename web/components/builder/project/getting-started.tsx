"use client";

import { ArrowRight, ChevronDown, X } from "lucide-react";
import { DoneMark } from "@/components/common/done-mark";
import { ProgressBar } from "@/components/common/progress-bar";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/common/icon-button";
import type { IssueCounts } from "@/components/builder/project/severity";
import { useProject } from "@/lib/project/context";
import { gettingStarted, type GettingStartedItem } from "@/lib/project/getting-started";
import { updateGettingStarted, useGettingStartedFlags } from "@/lib/project/getting-started-store";
import { describeComponent, type CatalogKind } from "@/lib/registry/catalog";
import { usePointAt } from "@/lib/tour/use-tour";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";

export function GettingStarted({
  issueCounts,
  onSelect,
  onShowChecks,
}: {
  issueCounts: IssueCounts;
  onSelect: (kind: CatalogKind) => void;
  onShowChecks: () => void;
}) {
  const t = useTranslations("gettingStarted");
  const { details, components } = useProject();
  const project = details?.name ?? "";
  const flags = useGettingStartedFlags(project);
  const pointAt = usePointAt("builder");

  const kinds = components.map((component) => describeComponent(component.recipe).kind);
  const progress = gettingStarted(kinds, issueCounts.error, flags);
  if (flags.dismissed || progress.complete) return null;

  const go = (item: GettingStartedItem) => {
    if (item.kind) onSelect(item.kind);
    else if (item.step === "checks") onShowChecks();
    else pointAt("download");
  };

  return (
    <section data-tour="checklist" className="rounded-xl border bg-card">
      <div className="flex items-center gap-1 py-2 pr-2 pl-4">
        <button
          type="button"
          aria-expanded={!flags.collapsed}
          onClick={() => updateGettingStarted(project, { collapsed: !flags.collapsed })}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <h2 className="text-sm font-medium">{t("title")}</h2>
          <Hint as="span" className="ml-auto tabular-nums">
            {t("progress", { done: progress.done, total: progress.total })}
          </Hint>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", flags.collapsed && "-rotate-90")} />
        </button>
        <IconButton icon={X} size="xs" label={t("dismiss")} onClick={() => updateGettingStarted(project, { dismissed: true })} />
      </div>
      <ProgressBar value={progress.done} max={progress.total} className="mx-4" />
      {flags.collapsed ? (
        <div className="h-3" />
      ) : (
        <ol className="flex flex-col gap-0.5 p-2">
          {progress.items.map((item) => (
            <li key={item.step}>
              {item.done ? (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                  <DoneMark done />
                  <span className="line-through">{t(`items.${item.step}.label`)}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => go(item)}
                  className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/50"
                >
                  <DoneMark done={false} className="mt-0.5" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm">{t(`items.${item.step}.label`)}</span>
                    <Hint as="span">{t(`items.${item.step}.hint`)}</Hint>
                  </span>
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
