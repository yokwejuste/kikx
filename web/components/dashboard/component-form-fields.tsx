"use client";

import { useId } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/dashboard/form-field";
import { ServerFields } from "@/components/dashboard/server-fields";
import { InventoryFields } from "@/components/dashboard/inventory-fields";
import { KeyValueFields } from "@/components/dashboard/key-value-fields";
import { GroupVarsFields } from "@/components/dashboard/group-vars-fields";
import { PlaysFields } from "@/components/dashboard/plays-fields";
import { SiteFields } from "@/components/dashboard/site-fields";
import type { ComponentKind, SiteImportValues } from "@/lib/schemas";
import { K8S_KINDS, type FormValues } from "@/lib/component-form-utils";

export interface FormContext {
  /** Group names from every Inventory in the project. */
  groupNames: string[];
  /** Role names worth suggesting: vendored roles plus roles other playbooks already use. */
  roleSuggestions: string[];
  /** Playbooks this project produces, for the site playbook's quick-add. */
  availablePlaybooks: SiteImportValues[];
  /** Service names, so an ingress can suggest its backend. */
  serviceNames: string[];
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
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const reg = (field: string) => form.register(field as never);
  const hostsListId = useId();
  const servicesListId = useId();

  if (kind === "groupvars") return <GroupVarsFields form={form} groupNames={context.groupNames} />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Name"
          registration={form.register("name")}
          error={errors.name}
          placeholder={kind === "playbook" ? "k8s" : kind === "site" ? "site" : "my-app"}
          description={
            kind === "inventory"
              ? "Becomes <name>-inventory.ini."
              : kind === "playbook"
                ? "The file name, without .yml."
                : kind === "commonrole" || kind === "role"
                  ? "Writes roles/<name>/ — use this name in a playbook."
                  : isK8s
                    ? "Also the default app label, so a Deployment and Service with the same name find each other."
                    : undefined
          }
        />

        {kind === "playbook" && (
          <FormField
            label="Folder"
            registration={reg("folder")}
            error={errors.folder}
            placeholder="playbooks"
            description="Where the file goes. Leave empty for the project root."
          />
        )}
        {kind === "role" && (
          <FormField
            label="Description"
            registration={reg("description")}
            error={errors.description}
            placeholder="What this role sets up (optional)"
          />
        )}
        {kind === "commonrole" && (
          <FormField label="Timezone" registration={reg("timezone")} error={errors.timezone} placeholder="UTC" />
        )}
        {kind === "deployment" && (
          <FormField label="Image" registration={reg("image")} error={errors.image} placeholder="nginx:1.27" />
        )}
        {kind === "ingress" && (
          <FormField label="Host" registration={reg("host")} error={errors.host} placeholder="app.example.com" />
        )}
        {(kind === "digitalocean" || kind === "hetzner") && (
          <FormField
            label="Region"
            registration={reg("region")}
            error={errors.region}
            placeholder={kind === "hetzner" ? "fsn1" : "nyc3"}
          />
        )}
        {kind === "ansible" && (
          <>
            <FormField
              label="Hosts"
              registration={reg("hosts")}
              error={errors.hosts}
              placeholder={context.groupNames[0] ?? "all"}
              list={hostsListId}
              description="An inventory group, or all."
            />
            <datalist id={hostsListId}>
              <option value="all" />
              {context.groupNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <FormField
              label="Kubernetes version"
              registration={reg("k8sVersion")}
              error={errors.k8sVersion}
              placeholder="1.31"
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
            placeholder="same as port"
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
              placeholder="same as name"
              list={servicesListId}
            />
            <datalist id={servicesListId}>
              {context.serviceNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </>
        )}
        {(kind === "digitalocean" || kind === "hetzner") && (
          <ServerFields kind={kind} form={form} errors={errors} reg={reg} />
        )}
        {isK8s && (
          <FormField
            label="Namespace"
            registration={form.register("namespace" as never)}
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
