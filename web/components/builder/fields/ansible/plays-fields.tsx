"use client";

import { useId } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Datalist } from "@/components/builder/fields/datalist";
import { SectionHeader } from "@/components/builder/fields/section-header";
import type { ListErrors } from "@/components/builder/fields/field-errors";
import { PlayCard } from "@/components/builder/fields/ansible/play-card";
import { emptyPlay, type FormValues } from "@/lib/forms/component-forms";
import type { PlayValues } from "@/lib/forms/schemas";

export function PlaysFields({
  form,
  groupNames,
  roleSuggestions,
}: {
  form: UseFormReturn<FormValues>;
  groupNames: string[];
  roleSuggestions: string[];
}) {
  const t = useTranslations("plays");
  const plays = useFieldArray({ control: form.control, name: "plays" as never });
  const values = (useWatch({ control: form.control, name: "plays" as never }) ?? []) as PlayValues[];
  const playbookName = useWatch({ control: form.control, name: "name" as never }) as unknown as string;
  const errors = form.formState.errors as unknown as { plays?: ListErrors<PlayValues> };
  const hostsListId = useId();

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title={t("title")}
        description={t("body")}
      />

      <Datalist id={hostsListId} options={["all", ...groupNames]} />

      <ol className="flex flex-col gap-3">
        {plays.fields.map((field, index) => (
          <PlayCard
            key={field.id}
            form={form}
            index={index}
            count={plays.fields.length}
            play={values[index]}
            errors={errors.plays?.[index]}
            playbookName={playbookName}
            hostsListId={hostsListId}
            defaultHosts={groupNames[0] ?? "all"}
            roleSuggestions={roleSuggestions}
            onMove={plays.move}
            onRemove={() => plays.remove(index)}
          />
        ))}
      </ol>
      <FieldError errors={[errors.plays]} />

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => plays.append(emptyPlay())}>
        <Plus />
        {t("add")}
      </Button>
    </section>
  );
}
