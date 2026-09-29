"use client";

import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { SectionHeader } from "@/components/builder/fields/section-header";
import { RowActions } from "@/components/builder/fields/row-actions";
import { AddWithSuggestions } from "@/components/builder/fields/add-with-suggestions";
import type { ListErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import type { SiteImportValues } from "@/lib/forms/schemas";

export function SiteFields({
  form,
  availablePlaybooks,
}: {
  form: UseFormReturn<FormValues>;
  availablePlaybooks: SiteImportValues[];
}) {
  const t = useTranslations("site");
  const imports = useFieldArray({ control: form.control, name: "imports" as never });
  const values = (useWatch({ control: form.control, name: "imports" as never }) ?? []) as SiteImportValues[];
  const errors = form.formState.errors as unknown as { imports?: ListErrors<SiteImportValues> };
  const importedPaths = new Set(values.map((v) => v.path));
  const notImported = availablePlaybooks.filter((p) => !importedPaths.has(p.path));

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title={t("title")}
        description={t.rich("body", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
      />

      {imports.fields.length > 0 && (
        <ol className="flex flex-col gap-2">
          {imports.fields.map((field, index) => {
            const rowErrors = errors.imports?.[index];
            return (
              <li key={field.id} className="flex flex-col gap-1 rounded-lg border p-2">
                <div className="grid items-center gap-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <span className="text-center text-xs text-muted-foreground">{index + 1}</span>
                  <Input
                    placeholder={t("namePlaceholder")}
                    aria-label={t("nameLabel")}
                    aria-invalid={!!rowErrors?.name}
                    {...form.register(`imports.${index}.name` as never)}
                  />
                  <Input
                    placeholder={t("pathPlaceholder")}
                    aria-label={t("pathLabel")}
                    aria-invalid={!!rowErrors?.path}
                    className="font-mono"
                    {...form.register(`imports.${index}.path` as never)}
                  />
                  <RowActions
                    index={index}
                    count={imports.fields.length}
                    labels={{ up: t("moveUp"), down: t("moveDown"), remove: t("remove") }}
                    onMove={imports.move}
                    onRemove={() => imports.remove(index)}
                  />
                </div>
                <FieldError className="px-8 text-xs" errors={[rowErrors?.name, rowErrors?.path]} />
              </li>
            );
          })}
        </ol>
      )}
      <FieldError errors={[errors.imports]} />

      <AddWithSuggestions
        addLabel={t("addPath")}
        onAdd={() => imports.append({ name: "", path: "" })}
        suggestionsLabel={t("fromProject")}
        suggestions={notImported.map((p) => p.path)}
        onPick={(path) => imports.append(notImported.find((p) => p.path === path)!)}
      >
        {notImported.length > 1 && (
          <Button type="button" variant="link" size="sm" onClick={() => imports.append(notImported)}>
            {t("addAll")}
          </Button>
        )}
      </AddWithSuggestions>
    </section>
  );
}
