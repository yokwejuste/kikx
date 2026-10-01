"use client";

import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FieldError } from "@/components/ui/field";
import { Disclosure } from "@/components/common/disclosure";
import { RemoveButton } from "@/components/builder/fields/row-actions";
import { RowInput } from "@/components/builder/fields/row-input";
import { TagInputField } from "@/components/builder/fields/tag-input-field";
import { KeyValueProblems } from "@/components/builder/fields/format/key-value-problems";
import { useKeyValueField } from "@/lib/format/use-key-value-field";
import type { RowErrors } from "@/components/builder/fields/field-errors";
import { cn } from "@/lib/utils";
import { parseKeyValuePairs } from "@/lib/format/key-value";
import type { FormValues } from "@/lib/forms/component-forms";
import type { InventoryHostValues } from "@/lib/forms/schemas";
import { Hint } from "@/components/common/hint";

export const HOST_COLUMNS = "sm:grid-cols-host-row";

function useConnectionSummary(host: InventoryHostValues | undefined): string {
  const t = useTranslations("inventory.host.summary");
  if (!host) return "";
  const bits: string[] = [];
  if (host.ansibleUser) bits.push(t("user", { value: host.ansibleUser }));
  if (host.ansiblePort) bits.push(t("port", { value: host.ansiblePort }));
  if (host.sshKeyFile) bits.push(t("keyFile"));
  const vars = parseKeyValuePairs(host.vars).length;
  if (vars) bits.push(t("vars", { count: vars }));
  return bits.length ? bits.join(" · ") : t("inherits");
}

export function HostRow({
  form,
  index,
  host,
  errors,
  knownGroups,
  canRemove,
  onRemove,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
  host: InventoryHostValues | undefined;
  errors: RowErrors<InventoryHostValues> | undefined;
  knownGroups: string[];
  canRemove: boolean;
  onRemove: () => void;
}) {
  const t = useTranslations("inventory.host");
  const summary = useConnectionSummary(host);
  const register = (field: keyof InventoryHostValues) => form.register(`hosts.${index}.${field}` as never);
  const vars = useKeyValueField(form, `hosts.${index}.vars`, " ");

  return (
    <div data-teach="host-row" className="rounded-lg border">
      <div className={cn("grid gap-2 p-2", HOST_COLUMNS)}>
        <RowInput
          data-teach="host-name"
          placeholder={t("namePlaceholder")}
          label={t("nameLabel")}
          invalid={!!errors?.name}
          mono
          registration={register("name")}
        />
        <RowInput
          data-teach="host-address"
          placeholder={t("addressPlaceholder")}
          label={t("addressLabel")}
          invalid={!!errors?.ansibleHost}
          mono
          registration={register("ansibleHost")}
        />
        <TagInputField
          form={form}
          name={`hosts.${index}.groups`}
          aria-label={t("groupsLabel")}
          suggestions={knownGroups}
          placeholder={t("groupsPlaceholder")}
          invalid={!!errors?.groups}
        />
        <RemoveButton label={t("remove")} disabled={!canRemove} onClick={onRemove} />
      </div>
      <FieldError className="px-3 pb-2 text-xs" errors={[errors?.name, errors?.ansibleHost, errors?.groups]} />

      <Disclosure title={t("connection")} hint={summary}>
        <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
          <RowInput data-teach="host-user" placeholder={t("sshUserPlaceholder")} label={t("sshUserLabel")} registration={register("ansibleUser")} />
          <RowInput
            type="number"
            placeholder={t("sshPortPlaceholder")}
            label={t("sshPortLabel")}
            invalid={!!errors?.ansiblePort}
            registration={register("ansiblePort")}
          />
          <RowInput placeholder={t("sshKeyPlaceholder")} label={t("sshKeyLabel")} registration={register("sshKeyFile")} />
          <RowInput
            placeholder={t("varsPlaceholder")}
            label={t("varsLabel")}
            mono
            invalid={vars.problems.length > 0}
            className="text-xs sm:col-span-3"
            registration={vars.registration}
            onPaste={vars.onPaste}
          />
          <KeyValueProblems className="text-xs sm:col-span-3" problems={vars.problems} />
          <Hint className="sm:col-span-3">
            {t("inheritNote")}
          </Hint>
          <FieldError className="text-xs sm:col-span-3" errors={[errors?.ansiblePort]} />
        </div>
      </Disclosure>
    </div>
  );
}
