"use client";

import { useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Datalist } from "@/components/builder/fields/datalist";
import { RowInput } from "@/components/builder/fields/row-input";
import { KeyValueFields } from "@/components/builder/fields/key-value-fields";
import { YamlField } from "@/components/builder/fields/format/yaml-field";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";
import { codeTag } from "@/components/common/rich-tags";

type Mode = "fields" | "yaml";
type KeyValue = { key: string; value: string };

function varsToYaml(vars: KeyValue[]): string {
  return vars
    .filter((v) => v.key)
    .map((v) => `${v.key}: ${v.value}`)
    .join("\n");
}

function yamlToVars(yaml: string): KeyValue[] | null {
  const lines = yaml.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#") && !/^-{3}$/.test(l.trim()));
  if (!lines.every((l) => /^[A-Za-z_][\w-]*:\s*\S/.test(l))) return null;
  return lines.map((l) => {
    const idx = l.indexOf(":");
    return { key: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() };
  });
}

export function GroupVarsFields({ form, groupNames }: { form: UseFormReturn<FormValues>; groupNames: string[] }) {
  const t = useTranslations("groupVars");
  const listId = useId();
  const groupInputId = useId();
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
        toast.info(t("nested"));
        return;
      }
      form.setValue("vars" as never, vars as never);
    }
    form.setValue("mode" as never, next as never, { shouldValidate: true });
  };

  return (
    <>
      <Field data-teach="groupvars-group" data-invalid={!!errors.group} className="max-w-sm">
        <FieldLabel htmlFor={groupInputId}>{t("group")}</FieldLabel>
        <RowInput
          id={groupInputId}
          list={listId}
          placeholder={groupNames[0] ?? "all"}
          invalid={!!errors.group}
          mono
          registration={form.register("group" as never)}
        />
        <Datalist id={listId} options={["all", ...groupNames]} />
        <Hint>
          {t.rich("writes", {
            path: `group_vars/${group || "<group>"}${layout === "dir" ? "/main" : ""}.yml`,
            code: codeTag,
          })}
          {groupNames.length === 0 && ` ${t("noInventory")}`}
        </Hint>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="layout"
            className="size-4 rounded border-input accent-primary"
            checked={layout === "dir"}
            onChange={(e) =>
              form.setValue("layout" as never, (e.target.checked ? "dir" : "file") as never, { shouldDirty: true })
            }
          />
          {t.rich("folderLayout", {
            path: `group_vars/${group || "<group>"}/main.yml`,
            code: (chunks) => <code className="font-mono text-xs">{chunks}</code>,
          })}
        </label>
        <FieldError errors={[errors.group]} />
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t("variables")}</span>
          <div role="radiogroup" aria-label={t("mode")} className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
            {(["fields", "yaml"] as const).map((m) => (
              <button
                key={m}
                data-teach={`groupvars-${m}`}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => switchTo(m)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === m ? "bg-volt-soft text-volt-soft-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`modes.${m}`)}
              </button>
            ))}
          </div>
        </div>

        {mode === "fields" ? (
          <KeyValueFields
            form={form}
            name="vars"
            label={t("simple")}
            addLabel={t("addVar")}
            keyPlaceholder={t("keyPlaceholder")}
            variableNames
          />
        ) : (
          <Field data-invalid={!!errors.yaml}>
            <YamlField
              form={form}
              name="yaml"
              teach="groupvars-yaml-text"
              label={t("variables")}
              invalid={!!errors.yaml}
              placeholder={"key: value\nlist:\n  - item\nmap:\n  nested: value"}
              className="min-h-48"
            />
            <Hint>
              {t("yamlHelp")}
            </Hint>
            <FieldError errors={[errors.yaml]} />
          </Field>
        )}
      </div>
    </>
  );
}
