"use client";

import { useId } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/builder/fields/form-field";
import { Datalist } from "@/components/builder/fields/datalist";
import { ServerFields } from "@/components/builder/fields/infra/server-fields";
import { InventoryFields } from "@/components/builder/fields/inventory/inventory-fields";
import { KeyValueFields } from "@/components/builder/fields/key-value-fields";
import { GroupVarsFields } from "@/components/builder/fields/ansible/group-vars-fields";
import { PlaysFields } from "@/components/builder/fields/ansible/plays-fields";
import { SiteFields } from "@/components/builder/fields/ansible/site-fields";
import type { FormContext } from "@/components/builder/editor/form-context";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import { K8S_KINDS, REFERENCES, type ComponentKind } from "@/lib/registry/references";
import { fieldExample, fieldSpec } from "@/lib/registry/store";

function nameDescription(kind: ComponentKind): string | undefined {
  if (kind === "inventory") return "Becomes <name>-inventory.ini.";
  if (kind === "playbook") return "The file name, without .yml.";
  if (kind === "commonrole" || kind === "role") return "Writes roles/<name>/ — use this name in a playbook.";
  if (K8S_KINDS.has(kind)) {
    return "Also the default app label, so a Deployment and Service with the same name find each other.";
  }
  return undefined;
}

export function ComponentFormFields({
  kind,
  form,
  context,
}: {
  kind: ComponentKind;
  form: UseFormReturn<FormValues>;
  context: FormContext;
}) {
  const isK8s = K8S_KINDS.has(kind);
  const errors = form.formState.errors as FieldErrors;
  const reg = (field: string) => form.register(field as never);
  const ref = REFERENCES[kind];
  const example = (field: string) => fieldExample(ref, field);
  const help = (field: string) => fieldSpec(ref, field)?.description ?? undefined;
  const hostsListId = useId();
  const servicesListId = useId();

  if (kind === "groupvars") return <GroupVarsFields form={form} groupNames={context.groupNames} />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Name"
          registration={reg("name")}
          error={errors.name}
          description={nameDescription(kind)}
        />

        {kind === "playbook" && (
          <FormField
            label="Folder"
            registration={reg("folder")}
            error={errors.folder}
            placeholder={example("folder")}
            description={help("folder")}
          />
        )}
        {kind === "role" && (
          <FormField
            label="Description"
            registration={reg("description")}
            error={errors.description}
            description={help("description")}
          />
        )}
        {kind === "commonrole" && (
          <FormField label="Timezone" registration={reg("timezone")} error={errors.timezone} description={help("timezone")} />
        )}
        {kind === "deployment" && (
          <FormField label="Image" registration={reg("image")} error={errors.image} placeholder={example("image")} />
        )}
        {kind === "ingress" && (
          <FormField label="Host" registration={reg("host")} error={errors.host} placeholder={example("host")} />
        )}
        {kind === "ansible" && (
          <>
            <FormField
              label="Hosts"
              registration={reg("hosts")}
              error={errors.hosts}
              placeholder={context.groupNames[0] ?? "all"}
              list={hostsListId}
              description={help("hosts")}
            />
            <Datalist id={hostsListId} options={["all", ...context.groupNames]} />
            <FormField
              label="Kubernetes version"
              registration={reg("k8sVersion")}
              error={errors.k8sVersion}
              placeholder={example("k8s_version")}
            />
          </>
        )}
        {isK8s && (
          <FormField label="Port" type="number" min={1} max={65535} registration={reg("port")} error={errors.port} />
        )}
        {kind === "deployment" && (
          <FormField label="Replicas" type="number" min={1} registration={reg("replicas")} error={errors.replicas} />
        )}
        {kind === "service" && (
          <FormField
            label="Target port"
            type="number"
            min={1}
            max={65535}
            description={help("target_port")}
            registration={reg("targetPort")}
            error={errors.targetPort}
          />
        )}
        {kind === "ingress" && (
          <>
            <FormField label="Path" registration={reg("path")} error={errors.path} />
            <FormField
              label="Backend service"
              registration={reg("service")}
              error={errors.service}
              description={help("service")}
              list={servicesListId}
            />
            <Datalist id={servicesListId} options={context.serviceNames} />
          </>
        )}
        {(kind === "digitalocean" || kind === "hetzner") && (
          <ServerFields kind={kind} errors={errors} reg={reg} />
        )}
        {isK8s && (
          <FormField
            label="Namespace"
            registration={reg("namespace")}
            error={errors.namespace}
            placeholder="project default"
          />
        )}
      </div>

      {isK8s && <KeyValueFields form={form} name="labels" label="Labels" addLabel="Add label" />}
      {kind === "inventory" && <InventoryFields form={form} externalGroupNames={context.groupNames} />}
      {kind === "playbook" && (
        <PlaysFields form={form} groupNames={context.groupNames} roleSuggestions={context.roleSuggestions} />
      )}
      {kind === "site" && <SiteFields form={form} availablePlaybooks={context.availablePlaybooks} />}
    </>
  );
}
