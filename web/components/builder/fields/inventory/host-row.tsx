"use client";

import type { UseFormReturn } from "react-hook-form";
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

function connectionSummary(host: InventoryHostValues | undefined): string {
  if (!host) return "";
  const bits: string[] = [];
  if (host.ansibleUser) bits.push(`user ${host.ansibleUser}`);
  if (host.ansiblePort) bits.push(`port ${host.ansiblePort}`);
  if (host.sshKeyFile) bits.push("key file");
  const vars = parseKeyValuePairs(host.vars).length;
  if (vars) bits.push(`${vars} var${vars === 1 ? "" : "s"}`);
  return bits.length ? bits.join(" · ") : "inherits from groups";
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
  const register = (field: keyof InventoryHostValues) => form.register(`hosts.${index}.${field}` as never);

  return (
    <div className="rounded-lg border">
      <div className={cn("grid gap-2 p-2", HOST_COLUMNS)}>
        <Input
          placeholder="host name"
          aria-label="Host name"
          aria-invalid={!!errors?.name}
          className="font-mono"
          {...register("name")}
        />
        <Input
          placeholder="IP or hostname (optional)"
          aria-label="Address"
          aria-invalid={!!errors?.ansibleHost}
          className="font-mono"
          {...register("ansibleHost")}
        />
        <TagInputField
          form={form}
          name={`hosts.${index}.groups`}
          aria-label="Groups"
          suggestions={knownGroups}
          placeholder="groups it belongs to"
          invalid={!!errors?.groups}
        />
        <RemoveButton aria-label="Remove host" disabled={!canRemove} onClick={onRemove} />
      </div>
      <FieldError className="px-3 pb-2 text-xs" errors={[errors?.name, errors?.ansibleHost, errors?.groups]} />

      <Disclosure title={<>Connection &amp; host vars</>} hint={connectionSummary(host)}>
        <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
          <Input placeholder="ssh user (inherit)" aria-label="SSH user" {...register("ansibleUser")} />
          <Input
            type="number"
            placeholder="ssh port (inherit)"
            aria-label="SSH port"
            aria-invalid={!!errors?.ansiblePort}
            {...register("ansiblePort")}
          />
          <Input placeholder="ssh key file (optional)" aria-label="SSH key file" {...register("sshKeyFile")} />
          <Input
            placeholder="host vars — key=value key2=value2"
            aria-label="Host vars"
            className="font-mono text-xs sm:col-span-3"
            {...register("vars")}
          />
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Leave user and port empty to inherit them from a group&apos;s vars — setting them here overrides the group.
          </p>
          <FieldError className="text-xs sm:col-span-3" errors={[errors?.ansiblePort]} />
        </div>
      </Disclosure>
    </div>
  );
}
