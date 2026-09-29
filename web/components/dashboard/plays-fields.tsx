"use client";

import { useId } from "react";
import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { TagInput } from "@/components/dashboard/tag-input";
import { emptyPlay, type FormValues } from "@/lib/component-form-utils";
import type { PlayValues } from "@/lib/schemas";

type FieldErr = { message?: string } | undefined;

export function PlaysFields({
  form,
  groupNames,
  roleSuggestions,
}: {
  form: UseFormReturn<FormValues>;
  groupNames: string[];
  roleSuggestions: string[];
}) {
  const plays = useFieldArray({ control: form.control, name: "plays" as never });
  const values = (useWatch({ control: form.control, name: "plays" as never }) ?? []) as PlayValues[];
  const playbookName = useWatch({ control: form.control, name: "name" as never }) as unknown as string;
  const errors = form.formState.errors as unknown as {
    plays?: (Partial<Record<keyof PlayValues, FieldErr>> | undefined)[] & { message?: string };
  };
  const hostsListId = useId();

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">Plays</h3>
        <p className="text-xs text-muted-foreground">
          Each play runs its roles, in order, on one inventory group. Most playbooks need one; add more to run
          different roles on different groups from the same file.
        </p>
      </div>

      <datalist id={hostsListId}>
        <option value="all" />
        {groupNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <ol className="flex flex-col gap-3">
        {plays.fields.map((field, index) => {
          const rowErrors = errors.plays?.[index];
          const play = values[index];
          return (
            <li key={field.id} className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Play {index + 1}
                  {play?.hosts ? ` · runs on ${play.hosts}` : ""}
                </span>
                <div className="flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move play up"
                    disabled={index === 0}
                    onClick={() => plays.move(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move play down"
                    disabled={index === plays.fields.length - 1}
                    onClick={() => plays.move(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove play"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={plays.fields.length === 1}
                    onClick={() => plays.remove(index)}
                  >
                    <X />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Name
                  <Input
                    placeholder={playbookName ? `e.g. ${playbookName}` : "What this play does"}
                    aria-invalid={!!rowErrors?.name}
                    className="text-foreground"
                    {...form.register(`plays.${index}.name` as never)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Runs on (hosts)
                  <Input
                    list={hostsListId}
                    placeholder={groupNames[0] ?? "all"}
                    aria-invalid={!!rowErrors?.hosts}
                    className="font-mono text-foreground"
                    {...form.register(`plays.${index}.hosts` as never)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                Roles, in the order they run
                <Controller
                  control={form.control}
                  name={`plays.${index}.roles` as never}
                  render={({ field: rolesField }) => (
                    <TagInput
                      aria-label="Roles"
                      ordered
                      value={(rolesField.value as string[] | undefined) ?? []}
                      onChange={rolesField.onChange}
                      suggestions={roleSuggestions}
                      placeholder="containerd, kube_common…"
                      invalid={!!rowErrors?.roles}
                    />
                  )}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Tags (optional)
                  <Controller
                    control={form.control}
                    name={`plays.${index}.tags` as never}
                    render={({ field: tagsField }) => (
                      <TagInput
                        aria-label="Tags"
                        value={(tagsField.value as string[] | undefined) ?? []}
                        onChange={tagsField.onChange}
                        placeholder="k8s, k8s_workers"
                      />
                    )}
                  />
                </div>
                <label className="flex h-8 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    {...form.register(`plays.${index}.become` as never)}
                  />
                  Run as root (become)
                </label>
              </div>

              <FieldError className="text-xs" errors={[rowErrors?.name, rowErrors?.hosts, rowErrors?.roles]} />
            </li>
          );
        })}
      </ol>
      <FieldError errors={[errors.plays?.message ? { message: errors.plays.message } : undefined]} />

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => plays.append(emptyPlay())}>
        <Plus />
        Add play
      </Button>
    </section>
  );
}
