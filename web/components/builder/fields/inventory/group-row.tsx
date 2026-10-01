"use client";

import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { RemoveButton } from "@/components/builder/fields/row-actions";
import { RowInput } from "@/components/builder/fields/row-input";
import { TagInputField } from "@/components/builder/fields/tag-input-field";
import { KeyValueProblems } from "@/components/builder/fields/format/key-value-problems";
import { useKeyValueField } from "@/lib/format/use-key-value-field";
import type { RowErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import type { InventoryGroupValues } from "@/lib/forms/schemas";
import { Hint } from "@/components/common/hint";

export function GroupRow({
  form,
  index,
  group,
  members,
  errors,
  knownGroups,
  onRemove,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
  group: InventoryGroupValues | undefined;
  members: number;
  errors: RowErrors<InventoryGroupValues> | undefined;
  knownGroups: string[];
  onRemove: () => void;
}) {
  const t = useTranslations("inventory.group");
  const vars = useKeyValueField(form, `groups.${index}.vars`, "\n");
  const membership = members > 0 ? t("members", { count: members }) : group?.children?.length ? t("parent") : t("empty");

  return (
    <div data-teach="group-row" className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_2rem]">
      <div className="flex flex-col gap-1">
        <RowInput
          placeholder={t("namePlaceholder")}
          label={t("nameLabel")}
          invalid={!!errors?.name}
          mono
          registration={form.register(`groups.${index}.name` as never)}
        />
        <Hint as="span" className="px-1">{membership}</Hint>
      </div>
      <TagInputField
        form={form}
        name={`groups.${index}.children`}
        aria-label={t("childrenLabel")}
        suggestions={knownGroups.filter((g) => g !== group?.name)}
        placeholder={t("childrenPlaceholder")}
        invalid={!!errors?.children}
      />
      <Textarea
        placeholder={t("varsPlaceholder")}
        aria-label={t("varsLabel")}
        aria-invalid={vars.problems.length > 0}
        spellCheck={false}
        rows={1}
        className="min-h-8 resize-none self-start py-1 font-mono"
        onPaste={vars.onPaste}
        {...vars.registration}
      />
      <RemoveButton label={t("remove")} onClick={onRemove} />
      <FieldError className="text-xs sm:col-span-4" errors={[errors?.name, errors?.children]} />
      <KeyValueProblems className="text-xs sm:col-span-4" problems={vars.problems} />
    </div>
  );
}
