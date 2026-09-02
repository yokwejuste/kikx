"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/dashboard/form-field";
import { ServerFields } from "@/components/dashboard/server-fields";
import { InventoryFields } from "@/components/dashboard/inventory-fields";
import { InventoryGroupsFields } from "@/components/dashboard/inventory-groups-fields";
import { LabelFields } from "@/components/dashboard/label-fields";
import type { ComponentKind } from "@/lib/schemas";
import { K8S_KINDS, type FormValues } from "@/lib/component-form-utils";

export function ComponentFormFields({
  kind,
  form,
}: {
  kind: ComponentKind;
  form: UseFormReturn<FormValues>;
}) {
  const isK8s = K8S_KINDS.has(kind);
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const reg = (field: string) => form.register(field as never);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" registration={form.register("name")} error={errors.name} placeholder="my-app" />

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
        {kind === "ansible" && (
          <FormField
            label="Hosts"
            registration={reg("hosts")}
            error={errors.hosts}
            placeholder="control_plane"
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

      {isK8s && <LabelFields form={form} />}
      {kind === "inventory" && (
        <>
          <InventoryFields form={form} />
          <InventoryGroupsFields form={form} />
        </>
      )}
    </>
  );
}
