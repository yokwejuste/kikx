"use client";

import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { Disclosure } from "@/components/common/disclosure";
import { RemoveButton } from "@/components/builder/fields/row-actions";
import { TagInputField } from "@/components/builder/fields/tag-input-field";
import type { RowErrors } from "@/components/builder/fields/field-errors";
import { cn } from "@/lib/utils";
import { parseKeyValuePairs } from "@/lib/ansible/inventory";
import type { FormValues } from "@/lib/forms/component-forms";
import type { InventoryHostValues } from "@/lib/forms/schemas";

export const HOST_COLUMNS = "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_2rem]";

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

  return (
    <div data-teach="host-row" className="rounded-lg border">
      <div className={cn("grid gap-2 p-2", HOST_COLUMNS)}>
        <Input
          data-teach="host-name"
          placeholder={t("namePlaceholder")}
          aria-label={t("nameLabel")}
          aria-invalid={!!errors?.name}
          className="font-mono"
          {...register("name")}
        />
        <Input
          data-teach="host-address"
          placeholder={t("addressPlaceholder")}
          aria-label={t("addressLabel")}
          aria-invalid={!!errors?.ansibleHost}
          className="font-mono"
          {...register("ansibleHost")}
        />
        <TagInputField
          form={form}
          name={`hosts.${index}.groups`}
          aria-label={t("groupsLabel")}
          suggestions={knownGroups}
          placeholder={t("groupsPlaceholder")}
          invalid={!!errors?.groups}
        />
        <RemoveButton aria-label={t("remove")} disabled={!canRemove} onClick={onRemove} />
      </div>
      <FieldError className="px-3 pb-2 text-xs" errors={[errors?.name, errors?.ansibleHost, errors?.groups]} />

      <Disclosure title={t("connection")} hint={summary}>
        <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
          <Input data-teach="host-user" placeholder={t("sshUserPlaceholder")} aria-label={t("sshUserLabel")} {...register("ansibleUser")} />
          <Input
            type="number"
            placeholder={t("sshPortPlaceholder")}
            aria-label={t("sshPortLabel")}
            aria-invalid={!!errors?.ansiblePort}
            {...register("ansiblePort")}
          />
          <Input placeholder={t("sshKeyPlaceholder")} aria-label={t("sshKeyLabel")} {...register("sshKeyFile")} />
          <Input
            placeholder={t("varsPlaceholder")}
            aria-label={t("varsLabel")}
            className="font-mono text-xs sm:col-span-3"
            {...register("vars")}
          />
          <p className="text-xs text-muted-foreground sm:col-span-3">
            {t("inheritNote")}
          </p>
          <FieldError className="text-xs sm:col-span-3" errors={[errors?.ansiblePort]} />
        </div>
      </Disclosure>
    </div>
  );
}
