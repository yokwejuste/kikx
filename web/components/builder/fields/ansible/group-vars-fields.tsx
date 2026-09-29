"use client";

import { useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Datalist } from "@/components/builder/fields/datalist";
import { KeyValueFields } from "@/components/builder/fields/key-value-fields";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import { cn } from "@/lib/utils";

type Mode = "fields" | "yaml";
type KeyValue = { key: string; value: string };

function varsToYaml(vars: KeyValue[]): string {
  return vars
    .filter((v) => v.key)
    .map((v) => `${v.key}: ${v.value}`)
    .join("\n");
}

/** Flat `key: value` YAML as rows, or null when it has nesting the key/value editor can't hold. */
function yamlToVars(yaml: string): KeyValue[] | null {
  const lines = yaml.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#") && l.trim() !== "---");
  if (!lines.every((l) => /^[A-Za-z_][\w-]*:\s*\S/.test(l))) return null;
  return lines.map((l) => {
    const idx = l.indexOf(":");
    return { key: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() };
  });
}

export function GroupVarsFields({ form, groupNames }: { form: UseFormReturn<FormValues>; groupNames: string[] }) {
  const listId = useId();
  const errors = form.formState.errors as FieldErrors;
  const mode = ((useWatch({ control: form.control, name: "mode" as never }) as unknown as Mode | undefined) ?? "fields");
  const group = useWatch({ control: form.control, name: "group" as never }) as unknown as string;
  const layout = useWatch({ control: form.control, name: "layout" as never }) as unknown as "file" | "dir" | undefined;

  const switchTo = (next: Mode) => {
    if (next === mode) return;
    const values = form.getValues() as unknown as { vars: KeyValue[]; yaml?: string };
    if (next === "yaml" && !values.yaml?.trim()) {
      form.setValue("yaml" as never, varsToYaml(values.vars) as never);
    }
    if (next === "fields" && values.yaml?.trim()) {
      const vars = yamlToVars(values.yaml);
      if (!vars) {
        toast.info("This YAML has nested values — keep editing it as YAML so nothing is lost.");
        return;
      }
      form.setValue("vars" as never, vars as never);
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
        <Datalist id={listId} options={["all", ...groupNames]} />
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
              placeholder={"key: value\nlist:\n  - item\nmap:\n  nested: value"}
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
