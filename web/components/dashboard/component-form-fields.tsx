"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/dashboard/form-field";
import { ServerFields } from "@/components/dashboard/server-fields";
import { InventoryFields } from "@/components/dashboard/inventory-fields";
import { InventoryGroupsFields } from "@/components/dashboard/inventory-groups-fields";
import { KeyValueFields } from "@/components/dashboard/key-value-fields";
import { RolePickerFields } from "@/components/dashboard/role-picker-fields";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComponentKind } from "@/lib/schemas";
import { K8S_KINDS, type FormValues } from "@/lib/component-form-utils";

export function ComponentFormFields({
  kind,
  form,
  inventoryGroupNames = [],
  availableRoleNames = [],
}: {
  kind: ComponentKind;
  form: UseFormReturn<FormValues>;
  inventoryGroupNames?: string[];
  availableRoleNames?: string[];
}) {
  const isK8s = K8S_KINDS.has(kind);
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const reg = (field: string) => form.register(field as never);
  const hostsValue = form.watch("hosts" as never) as unknown as string | undefined;
  const groupValue = form.watch("group" as never) as unknown as string | undefined;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {kind !== "groupvars" && (
          <FormField label="Name" registration={form.register("name")} error={errors.name} placeholder="my-app" />
        )}

        {kind === "groupvars" && inventoryGroupNames.length > 0 && (
          <Field data-invalid={!!errors.group}>
            <FieldLabel>Group</FieldLabel>
            <Select
              value={groupValue || undefined}
              onValueChange={(value) => form.setValue("group" as never, value as never, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a group from your Inventory" />
              </SelectTrigger>
              <SelectContent>
                {inventoryGroupNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Writes to group_vars/&lt;group&gt;.yml.</p>
            <FieldError errors={[errors.group]} />
          </Field>
        )}
        {kind === "groupvars" && inventoryGroupNames.length === 0 && (
          <FormField
            label="Group"
            registration={reg("group")}
            error={errors.group}
            placeholder="all"
            description="No Inventory added yet — type a group name it'll apply to. Add an Inventory component to pick from a list instead."
          />
        )}

        {kind === "deployment" && (
          <FormField label="Image" registration={reg("image")} error={errors.image} placeholder="nginx:1.27" />
        )}
        {kind === "ingress" && (
          <FormField
            label="Host"
            registration={reg("host")}
            error={errors.host}
            placeholder="<name>.example.com"
          />
        )}
        {(kind === "digitalocean" || kind === "hetzner") && (
          <FormField label="Region" registration={reg("region")} error={errors.region} placeholder="nyc3" />
        )}
        {(kind === "ansible" || kind === "playbook") && inventoryGroupNames.length > 0 && (
          <Field data-invalid={!!errors.hosts}>
            <FieldLabel>Hosts</FieldLabel>
            <Select
              value={hostsValue || undefined}
              onValueChange={(value) => form.setValue("hosts" as never, value as never, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a group from your Inventory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all (every host)</SelectItem>
                {inventoryGroupNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Which Inventory group this playbook runs against.</p>
            <FieldError errors={[errors.hosts]} />
          </Field>
        )}
        {(kind === "ansible" || kind === "playbook") && inventoryGroupNames.length === 0 && (
          <FormField
            label="Hosts"
            registration={reg("hosts")}
            error={errors.hosts}
            placeholder="all"
            description="No Inventory added yet — type a group name, or 'all' for every host. Add an Inventory component to pick from a list instead."
          />
        )}
        {isK8s && (
          <FormField
            label="Port"
            type="number"
            min={1}
            max={65535}
            registration={reg("port")}
            error={errors.port}
          />
        )}

        {kind === "deployment" && (
          <FormField
            label="Replicas"
            type="number"
            min={1}
            registration={reg("replicas")}
            error={errors.replicas}
          />
        )}
        {kind === "service" && (
          <FormField
            label="Target port"
            type="number"
            min={1}
            max={65535}
            placeholder="defaults to port"
            registration={reg("targetPort")}
            error={errors.targetPort}
          />
        )}
        {kind === "ingress" && (
          <>
            <FormField label="Path" registration={reg("path")} error={errors.path} placeholder="/" />
            <FormField
              label="Backend service"
              registration={reg("service")}
              error={errors.service}
              placeholder="defaults to name"
            />
          </>
        )}
        {(kind === "digitalocean" || kind === "hetzner") && (
          <ServerFields kind={kind} form={form} errors={errors} reg={reg} />
        )}
        {kind === "ansible" && (
          <FormField
            label="Kubernetes version"
            registration={reg("k8sVersion")}
            error={errors.k8sVersion}
            placeholder="1.31"
          />
        )}
        {isK8s && (
          <FormField
            label="Namespace override"
            registration={form.register("namespace" as never)}
            error={errors.namespace}
            placeholder="default"
          />
        )}
      </div>

      {isK8s && <KeyValueFields form={form} name="labels" label="Labels" addLabel="Add label" />}
      {kind === "inventory" && (
        <>
          <InventoryFields form={form} />
          <InventoryGroupsFields form={form} />
        </>
      )}
      {kind === "groupvars" && (
        <KeyValueFields
          form={form}
          name="vars"
          label="Variables"
          addLabel="Add variable"
          keyPlaceholder="key (e.g. app_port)"
          valuePlaceholder="value"
        />
      )}
      {kind === "playbook" && <RolePickerFields form={form} availableRoleNames={availableRoleNames} />}
    </>
  );
}
