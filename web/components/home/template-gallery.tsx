"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutTemplate, LoaderCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TemplateGallery({
  opening,
  onSelect,
}: {
  opening: string | null;
  onSelect: (name: string) => void;
}) {
  const presets = useQuery({ queryKey: ["kikx-presets"], queryFn: api.presets, staleTime: Infinity });

  if (!presets.data?.length) return null;

  return (
    <section className="w-full text-left">
      <h2 className="text-sm font-medium">Start from a template</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A complete, editable project to adapt instead of starting from an empty page.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {presets.data.map((preset) => (
          <li key={preset.name}>
            <button
              type="button"
              disabled={opening !== null}
              onClick={() => onSelect(preset.name)}
              className={cn(
                "flex h-full w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-60",
                opening === preset.name && "border-primary",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {opening === preset.name ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LayoutTemplate className="size-4 text-muted-foreground" />
                )}
                {preset.title}
              </span>
              <span className="text-sm text-muted-foreground">{preset.description}</span>
              <span className="mt-auto font-mono text-xs text-muted-foreground">
                {preset.name} · {pluralize(preset.componentCount, "component")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
