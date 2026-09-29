"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
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

type Translate = ReturnType<typeof useTranslations<"fields">>;

function nameDescription(kind: ComponentKind, t: Translate): string | undefined {
  if (kind === "inventory") return t("nameHelp.inventory", { file: "<name>-inventory.ini" });
  if (kind === "playbook") return t("nameHelp.playbook");
  if (kind === "commonrole" || kind === "role") return t("nameHelp.role", { path: "roles/<name>/" });
  if (K8S_KINDS.has(kind)) return t("nameHelp.k8s");
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
  const t = useTranslations("fields");
  const text = useCatalogText();
  const isK8s = K8S_KINDS.has(kind);
  const errors = form.formState.errors as FieldErrors;
  const reg = (field: string) => form.register(field as never);
  const ref = REFERENCES[kind];
  const example = (field: string) => fieldExample(ref, field);
  const help = (field: string) => text.fieldHelp(kind, field, fieldSpec(ref, field)?.description);
  const hostsListId = useId();
  const servicesListId = useId();

  if (kind === "groupvars") return <GroupVarsFields form={form} groupNames={context.groupNames} />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t("name")}
          registration={reg("name")}
          error={errors.name}
          description={nameDescription(kind, t)}
        />

        {kind === "playbook" && (
          <FormField
            label={t("folder")}
            registration={reg("folder")}
            error={errors.folder}
            placeholder={example("folder")}
            description={help("folder")}
          />
        )}
        {kind === "role" && (
          <FormField
            label={t("description")}
            registration={reg("description")}
            error={errors.description}
            description={help("description")}
          />
        )}
        {kind === "ansiblecfg" && (
          <>
            <FormField
              label={t("inventoryFile")}
              registration={reg("inventory")}
              error={errors.inventory}
              placeholder={example("inventory")}
              description={help("inventory")}
            />
            <FormField label={t("rolesPath")} registration={reg("rolesPath")} error={errors.rolesPath} />
          </>
        )}
        {kind === "commonrole" && (
          <FormField label={t("timezone")} registration={reg("timezone")} error={errors.timezone} description={help("timezone")} />
        )}
        {kind === "deployment" && (
          <FormField label={t("image")} registration={reg("image")} error={errors.image} placeholder={example("image")} />
        )}
        {kind === "ingress" && (
          <FormField label={t("host")} registration={reg("host")} error={errors.host} placeholder={example("host")} />
        )}
        {kind === "ansible" && (
          <>
            <FormField
              label={t("hosts")}
              registration={reg("hosts")}
              error={errors.hosts}
              placeholder={context.groupNames[0] ?? "all"}
              list={hostsListId}
              description={help("hosts")}
            />
            <Datalist id={hostsListId} options={["all", ...context.groupNames]} />
            <FormField
              label={t("k8sVersion")}
              registration={reg("k8sVersion")}
              error={errors.k8sVersion}
              placeholder={example("k8s_version")}
            />
          </>
        )}
        {isK8s && (
          <FormField label={t("port")} type="number" min={1} max={65535} registration={reg("port")} error={errors.port} />
        )}
        {kind === "deployment" && (
          <FormField label={t("replicas")} type="number" min={1} registration={reg("replicas")} error={errors.replicas} />
        )}
        {kind === "service" && (
          <FormField
            label={t("targetPort")}
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
            <FormField label={t("path")} registration={reg("path")} error={errors.path} />
            <FormField
              label={t("backendService")}
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
            label={t("namespace")}
            registration={reg("namespace")}
            error={errors.namespace}
            placeholder={t("namespacePlaceholder")}
          />
        )}
      </div>

      {isK8s && <KeyValueFields form={form} name="labels" label={t("labels")} addLabel={t("addLabel")} />}
      {kind === "inventory" && <InventoryFields form={form} externalGroupNames={context.groupNames} />}
      {kind === "playbook" && (
        <PlaysFields form={form} groupNames={context.groupNames} roleSuggestions={context.roleSuggestions} />
      )}
      {kind === "site" && <SiteFields form={form} availablePlaybooks={context.availablePlaybooks} />}
    </>
  );
}
