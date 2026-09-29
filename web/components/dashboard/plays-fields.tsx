"use client";

import { useId } from "react";
import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { TagInput } from "@/components/dashboard/tag-input";
import { emptyPlay, type FormValues } from "@/lib/component-form-utils";
import type { PlayValues } from "@/lib/schemas";

type FieldErr = { message?: string } | undefined;

function countConditions(play: PlayValues | undefined): number {
  if (!play) return 0;
  return play.roles.filter((role) => play.conditions?.[role]?.trim()).length;
}

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

              <details className="group/cond rounded-md border border-dashed">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-3.5 transition-transform group-open/cond:rotate-90" />
                  Role conditions (<code className="font-mono">when:</code>)
                  <span className="text-muted-foreground/80">
                    — {countConditions(play)} of {play?.roles?.length ?? 0} set
                  </span>
                </summary>
                <div className="flex flex-col gap-2 px-2.5 pb-2.5">
                  {!play?.roles?.length ? (
                    <p className="text-xs text-muted-foreground">Add roles above first.</p>
                  ) : (
                    <Controller
                      control={form.control}
                      name={`plays.${index}.conditions` as never}
                      render={({ field: conditionsField }) => {
                        const conditions = (conditionsField.value as Record<string, string> | undefined) ?? {};
                        return (
                          <>
                            {play.roles.map((role) => (
                              <label key={role} className="grid items-center gap-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr]">
                                <span className="truncate font-mono text-foreground">{role}</span>
                                <Input
                                  value={conditions[role] ?? ""}
                                  placeholder="always runs — e.g. db_tls_enabled | default(false)"
                                  className="font-mono text-xs"
                                  onChange={(e) => conditionsField.onChange({ ...conditions, [role]: e.target.value })}
                                />
                              </label>
                            ))}
                          </>
                        );
                      }}
                    />
                  )}
                </div>
              </details>

              <details className="group/tasks rounded-md border border-dashed">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-3.5 transition-transform group-open/tasks:rotate-90" />
                  Pre-tasks &amp; post-tasks
                  <span className="text-muted-foreground/80">
                    — {[play?.preTasks?.trim() && "pre", play?.postTasks?.trim() && "post"].filter(Boolean).join(" + ") || "none"}
                  </span>
                </summary>
                <div className="grid gap-2 px-2.5 pb-2.5 sm:grid-cols-2">
                  {(["preTasks", "postTasks"] as const).map((key) => (
                    <label key={key} className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {key === "preTasks" ? "Before the roles" : "After the roles"}
                      <Textarea
                        spellCheck={false}
                        placeholder={"- name: Annotate the deploy\n  ansible.builtin.include_role:\n    name: monitoring_annotate"}
                        className="min-h-24 font-mono text-xs text-foreground"
                        {...form.register(`plays.${index}.${key}` as never)}
                      />
                    </label>
                  ))}
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    A YAML list of tasks, written as-is under <code className="font-mono">pre_tasks:</code> /{" "}
                    <code className="font-mono">post_tasks:</code>.
                  </p>
                </div>
              </details>

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
