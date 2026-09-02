"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/dashboard/form-field";
import type { FormValues } from "@/lib/component-form-utils";

export function InventoryFields({
  errors,
  reg,
}: {
  errors: Record<string, { message?: string } | undefined>;
  reg: (field: string) => ReturnType<UseFormReturn<FormValues>["register"]>;
}) {
  return (
    <>
      <FormField
        label="Host / IP"
        registration={reg("ansibleHost")}
        error={errors.ansibleHost}
        placeholder="203.0.113.10"
      />
      <FormField label="SSH user" registration={reg("ansibleUser")} error={errors.ansibleUser} placeholder="root" />
      <FormField
        label="SSH port"
        type="number"
        min={1}
        max={65535}
        registration={reg("ansiblePort")}
        error={errors.ansiblePort}
      />
      <FormField
        label="SSH key file"
        registration={reg("sshKeyFile")}
        error={errors.sshKeyFile}
        placeholder="~/.ssh/id_ed25519 (optional)"
      />
    </>
  );
}
