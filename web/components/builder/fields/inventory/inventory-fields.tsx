"use client";

import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { SectionHeader } from "@/components/builder/fields/section-header";
import { AddWithSuggestions } from "@/components/builder/fields/add-with-suggestions";
import type { ListErrors } from "@/components/builder/fields/field-errors";
import { InventoryImportDialog } from "@/components/builder/fields/inventory/inventory-import-dialog";
import { HOST_COLUMNS, HostRow } from "@/components/builder/fields/inventory/host-row";
import { GroupRow } from "@/components/builder/fields/inventory/group-row";
import type { FormValues } from "@/lib/forms/component-forms";
import type { InventoryGroupValues, InventoryHostValues } from "@/lib/forms/schemas";
import { cn } from "@/lib/utils";

const EMPTY_HOST: InventoryHostValues = {
  name: "",
  ansibleHost: "",
  groups: [],
  ansibleUser: "",
  ansiblePort: undefined,
  sshKeyFile: "",
  vars: "",
};

const emptyGroup = (name = ""): InventoryGroupValues => ({ name, children: [], vars: "" });

export function InventoryFields({
  form,
  externalGroupNames = [],
}: {
  form: UseFormReturn<FormValues>;
  externalGroupNames?: string[];
}) {
  const hostFields = useFieldArray({ control: form.control, name: "hosts" as never });
  const groupFields = useFieldArray({ control: form.control, name: "groups" as never });
  const hosts = (useWatch({ control: form.control, name: "hosts" as never }) ?? []) as InventoryHostValues[];
  const groups = (useWatch({ control: form.control, name: "groups" as never }) ?? []) as InventoryGroupValues[];
  const errors = form.formState.errors as unknown as {
    hosts?: ListErrors<InventoryHostValues>;
    groups?: ListErrors<InventoryGroupValues>;
  };

  const memberCount = new Map<string, number>();
  for (const host of hosts) for (const g of host.groups ?? []) memberCount.set(g, (memberCount.get(g) ?? 0) + 1);

  const knownGroupSet = new Set<string>(externalGroupNames);
  for (const g of memberCount.keys()) knownGroupSet.add(g);
  for (const group of groups) {
    if (group.name) knownGroupSet.add(group.name);
    for (const c of group.children ?? []) knownGroupSet.add(c);
  }
  const knownGroups = Array.from(knownGroupSet);

  const listedGroups = new Set(groups.map((g) => g.name));
  const unlistedHostGroups = Array.from(memberCount.keys()).filter((g) => !listedGroups.has(g));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <SectionHeader
          title={`Hosts (${hostFields.fields.length})`}
          description="One row per server. Put it in every group it belongs to — kikx writes its address once and references it by name elsewhere."
        >
          <InventoryImportDialog
            onImport={(parsed) => {
              hostFields.replace(parsed.hosts);
              groupFields.replace(parsed.groups);
              toast.success(`Imported ${parsed.hosts.length} hosts and ${parsed.groups.length} groups`);
            }}
          />
        </SectionHeader>

        <div className={cn("hidden gap-2 px-3 text-xs font-medium text-muted-foreground sm:grid", HOST_COLUMNS)}>
          <span>Host name</span>
          <span>Address</span>
          <span>Groups</span>
        </div>

        <div className="flex flex-col gap-2">
          {hostFields.fields.map((field, index) => (
            <HostRow
              key={field.id}
              form={form}
              index={index}
              host={hosts[index]}
              errors={errors.hosts?.[index]}
              knownGroups={knownGroups}
              canRemove={hostFields.fields.length > 1}
              onRemove={() => hostFields.remove(index)}
            />
          ))}
        </div>
        <FieldError errors={[errors.hosts]} />
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => hostFields.append({ ...EMPTY_HOST })}>
          <Plus />
          Add host
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Groups"
          description="Nest groups (:children) and give them shared vars (:vars). Groups your hosts use exist already — add a row only to nest them or attach vars."
        />

        {groupFields.fields.length > 0 && (
          <div className="flex flex-col gap-2">
            {groupFields.fields.map((field, index) => (
              <GroupRow
                key={field.id}
                form={form}
                index={index}
                group={groups[index]}
                members={memberCount.get(groups[index]?.name ?? "") ?? 0}
                errors={errors.groups?.[index]}
                knownGroups={knownGroups}
                onRemove={() => groupFields.remove(index)}
              />
            ))}
          </div>
        )}

        <AddWithSuggestions
          addLabel="Add group"
          onAdd={() => groupFields.append(emptyGroup())}
          suggestionsLabel="or configure:"
          suggestions={unlistedHostGroups}
          onPick={(name) => groupFields.append(emptyGroup(name))}
        />
      </section>
    </div>
  );
}
