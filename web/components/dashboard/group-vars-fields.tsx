"use client";

import { useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { KeyValueFields } from "@/components/dashboard/key-value-fields";
import type { FormValues } from "@/lib/component-form-utils";
import { cn } from "@/lib/utils";

type Mode = "fields" | "yaml";

export function GroupVarsFields({ form, groupNames }: { form: UseFormReturn<FormValues>; groupNames: string[] }) {
  const listId = useId();
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const mode = ((useWatch({ control: form.control, name: "mode" as never }) as unknown as Mode | undefined) ?? "fields");
  const group = useWatch({ control: form.control, name: "group" as never }) as unknown as string;
  const layout = useWatch({ control: form.control, name: "layout" as never }) as unknown as "file" | "dir" | undefined;

  const switchTo = (next: Mode) => {
    if (next === mode) return;
    const values = form.getValues() as unknown as { vars: { key: string; value: string }[]; yaml?: string };
    if (next === "yaml" && !values.yaml?.trim()) {
      const yaml = values.vars
        .filter((v) => v.key)
        .map((v) => `${v.key}: ${v.value}`)
        .join("\n");
      form.setValue("yaml" as never, yaml as never);
    }
    if (next === "fields" && values.yaml?.trim()) {
      const lines = values.yaml.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#") && l.trim() !== "---");
      const simple = lines.every((l) => /^[A-Za-z_][\w-]*:\s*\S/.test(l));
      if (!simple) {
        toast.info("This YAML has nested values — keep editing it as YAML so nothing is lost.");
        return;
      }
      form.setValue(
        "vars" as never,
        lines.map((l) => {
          const idx = l.indexOf(":");
          return { key: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() };
        }) as never,
      );
    }
    form.setValue("mode" as never, next as never, { shouldValidate: true });
  };

  return (
    <>
      <Field data-invalid={!!errors.group} className="max-w-sm">
        <FieldLabel>Group</FieldLabel>
        <Input
          list={listId}
          placeholder={groupNames[0] ?? "all"}
          aria-invalid={!!errors.group}
          className="font-mono"
          {...form.register("group" as never)}
        />
        <datalist id={listId}>
          <option value="all" />
          {groupNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          Writes{" "}
          <code className="font-mono">
            group_vars/{group || "<group>"}
            {layout === "dir" ? "/main" : ""}.yml
          </code>
          {groupNames.length === 0 && " — add an Inventory to pick from its groups."}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={layout === "dir"}
            onChange={(e) =>
              form.setValue("layout" as never, (e.target.checked ? "dir" : "file") as never, { shouldDirty: true })
            }
          />
          Folder layout (<code className="font-mono text-xs">group_vars/{group || "<group>"}/main.yml</code>)
        </label>
        <FieldError errors={[errors.group]} />
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Variables</span>
          <div role="radiogroup" aria-label="Editing mode" className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
            {(["fields", "yaml"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => switchTo(m)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "fields" ? "Key / value" : "YAML"}
              </button>
            ))}
          </div>
        </div>

        {mode === "fields" ? (
          <KeyValueFields
            form={form}
            name="vars"
            label="Simple values"
            addLabel="Add variable"
            keyPlaceholder="key (e.g. app_port)"
            valuePlaceholder="value"
          />
        ) : (
          <Field data-invalid={!!errors.yaml}>
            <Textarea
              spellCheck={false}
              aria-invalid={!!errors.yaml}
              placeholder={"postgres_version: 16\nbackup:\n  schedule: \"0 2 * * *\"\n  keep_days: 14"}
              className="min-h-48 font-mono text-xs"
              {...form.register("yaml" as never)}
            />
            <p className="text-xs text-muted-foreground">
              Paste lists, maps, anything YAML — it&apos;s written as-is. Ideal for copying an existing group_vars file.
            </p>
            <FieldError errors={[errors.yaml]} />
          </Field>
        )}
      </div>
    </>
  );
}
