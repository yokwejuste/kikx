"use client";

import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import type { FormValues } from "@/lib/component-form-utils";
import type { SiteImportValues } from "@/lib/schemas";

type FieldErr = { message?: string } | undefined;

export function SiteFields({
  form,
  availablePlaybooks,
}: {
  form: UseFormReturn<FormValues>;
  availablePlaybooks: SiteImportValues[];
}) {
  const imports = useFieldArray({ control: form.control, name: "imports" as never });
  const values = (useWatch({ control: form.control, name: "imports" as never }) ?? []) as SiteImportValues[];
  const errors = form.formState.errors as unknown as {
    imports?: (Partial<Record<keyof SiteImportValues, FieldErr>> | undefined)[] & { message?: string };
  };
  const importedPaths = new Set(values.map((v) => v.path));
  const notImported = availablePlaybooks.filter((p) => !importedPaths.has(p.path));

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">Imports, in run order</h3>
        <p className="text-xs text-muted-foreground">
          <code className="font-mono">ansible-playbook site.yml</code> runs these top to bottom. Pick playbooks from this
          project, or type the path of one that already lives in your repo.
        </p>
      </div>

      {imports.fields.length > 0 && (
        <ol className="flex flex-col gap-2">
          {imports.fields.map((field, index) => {
            const rowErrors = errors.imports?.[index];
            return (
              <li key={field.id} className="flex flex-col gap-1 rounded-lg border p-2">
                <div className="grid items-center gap-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <span className="text-center text-xs text-muted-foreground">{index + 1}</span>
                  <Input
                    placeholder="Provision the database tier"
                    aria-label="Import name"
                    aria-invalid={!!rowErrors?.name}
                    {...form.register(`imports.${index}.name` as never)}
                  />
                  <Input
                    placeholder="playbooks/db.yml"
                    aria-label="Playbook path"
                    aria-invalid={!!rowErrors?.path}
                    className="font-mono"
                    {...form.register(`imports.${index}.path` as never)}
                  />
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => imports.move(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move down"
                      disabled={index === imports.fields.length - 1}
                      onClick={() => imports.move(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove import"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => imports.remove(index)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
                <FieldError className="px-8 text-xs" errors={[rowErrors?.name, rowErrors?.path]} />
              </li>
            );
          })}
        </ol>
      )}
      <FieldError errors={[errors.imports?.message ? { message: errors.imports.message } : undefined]} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => imports.append({ name: "", path: "" })}>
          <Plus />
          Add path
        </Button>
        {notImported.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">from this project:</span>
            {notImported.map((playbook) => (
              <button
                key={playbook.path}
                type="button"
                onClick={() => imports.append(playbook)}
                className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed px-2 font-mono text-xs text-muted-foreground hover:border-solid hover:text-foreground"
              >
                <Plus className="size-3" />
                {playbook.path}
              </button>
            ))}
            {notImported.length > 1 && (
              <Button type="button" variant="link" size="sm" onClick={() => notImported.forEach((p) => imports.append(p))}>
                Add all
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
