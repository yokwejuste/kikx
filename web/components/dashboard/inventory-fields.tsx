"use client";

import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { ChevronRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { TagInput } from "@/components/dashboard/tag-input";
import { InventoryImportDialog } from "@/components/dashboard/inventory-import-dialog";
import { parseKeyValuePairs } from "@/lib/inventory-utils";
import type { FormValues } from "@/lib/component-form-utils";
import type { InventoryGroupValues, InventoryHostValues } from "@/lib/schemas";

type FieldErr = { message?: string } | undefined;
type HostErrors = Partial<Record<keyof InventoryHostValues, FieldErr>>;
type GroupErrors = Partial<Record<keyof InventoryGroupValues, FieldErr>>;

const EMPTY_HOST: InventoryHostValues = {
  name: "",
  ansibleHost: "",
  groups: [],
  ansibleUser: "",
  ansiblePort: undefined,
  sshKeyFile: "",
  vars: "",
};

function SectionHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex shrink-0 gap-2">{children}</div>}
    </div>
  );
}

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
    hosts?: (HostErrors | undefined)[] & { message?: string };
    groups?: (GroupErrors | undefined)[];
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

        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_2rem] gap-2 px-3 text-xs font-medium text-muted-foreground sm:grid">
          <span>Host name</span>
          <span>Address</span>
          <span>Groups</span>
        </div>

        <div className="flex flex-col gap-2">
          {hostFields.fields.map((field, index) => {
            const rowErrors = errors.hosts?.[index];
            const host = hosts[index];
            return (
              <div key={field.id} className="rounded-lg border">
                <div className="grid gap-2 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_2rem]">
                  <Input
                    placeholder="cp-01"
                    aria-label="Host name"
                    aria-invalid={!!rowErrors?.name}
                    className="font-mono"
                    {...form.register(`hosts.${index}.name` as never)}
                  />
                  <Input
                    placeholder="10.0.0.11 (optional)"
                    aria-label="Address"
                    aria-invalid={!!rowErrors?.ansibleHost}
                    className="font-mono"
                    {...form.register(`hosts.${index}.ansibleHost` as never)}
                  />
                  <Controller
                    control={form.control}
                    name={`hosts.${index}.groups` as never}
                    render={({ field: groupsField }) => (
                      <TagInput
                        aria-label="Groups"
                        value={(groupsField.value as string[] | undefined) ?? []}
                        onChange={groupsField.onChange}
                        suggestions={knownGroups}
                        placeholder="k8s_workers, db…"
                        invalid={!!rowErrors?.groups}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove host"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={hostFields.fields.length === 1}
                    onClick={() => hostFields.remove(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <FieldError className="px-3 pb-2 text-xs" errors={[rowErrors?.name, rowErrors?.ansibleHost, rowErrors?.groups]} />

                <details className="group border-t">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
                    Connection &amp; host vars
                    <span className="truncate text-muted-foreground/80">— {connectionSummary(host)}</span>
                  </summary>
                  <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
                    <Input
                      placeholder="ssh user (inherit)"
                      aria-label="SSH user"
                      {...form.register(`hosts.${index}.ansibleUser` as never)}
                    />
                    <Input
                      type="number"
                      placeholder="ssh port (inherit)"
                      aria-label="SSH port"
                      aria-invalid={!!rowErrors?.ansiblePort}
                      {...form.register(`hosts.${index}.ansiblePort` as never)}
                    />
                    <Input
                      placeholder="ssh key file (optional)"
                      aria-label="SSH key file"
                      {...form.register(`hosts.${index}.sshKeyFile` as never)}
                    />
                    <Input
                      placeholder="host vars — kube_bootstrap=true public_ip=203.0.113.9"
                      aria-label="Host vars"
                      className="font-mono text-xs sm:col-span-3"
                      {...form.register(`hosts.${index}.vars` as never)}
                    />
                    <p className="text-xs text-muted-foreground sm:col-span-3">
                      Leave user and port empty to inherit them from a group&apos;s vars — setting them here overrides
                      the group.
                    </p>
                    <FieldError className="text-xs sm:col-span-3" errors={[rowErrors?.ansiblePort]} />
                  </div>
                </details>
              </div>
            );
          })}
        </div>
        <FieldError errors={[errors.hosts?.message ? { message: errors.hosts.message } : undefined]} />
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
            {groupFields.fields.map((field, index) => {
              const rowErrors = errors.groups?.[index];
              const group = groups[index];
              const members = memberCount.get(group?.name ?? "") ?? 0;
              return (
                <div
                  key={field.id}
                  className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_2rem]"
                >
                  <div className="flex flex-col gap-1">
                    <Input
                      placeholder="group name"
                      aria-label="Group name"
                      aria-invalid={!!rowErrors?.name}
                      className="font-mono"
                      {...form.register(`groups.${index}.name` as never)}
                    />
                    <span className="px-1 text-xs text-muted-foreground">
                      {members > 0
                        ? `${members} host${members === 1 ? "" : "s"}`
                        : group?.children?.length
                          ? "parent group"
                          : "no hosts yet"}
                    </span>
                  </div>
                  <Controller
                    control={form.control}
                    name={`groups.${index}.children` as never}
                    render={({ field: childrenField }) => (
                      <TagInput
                        aria-label="Child groups"
                        value={(childrenField.value as string[] | undefined) ?? []}
                        onChange={childrenField.onChange}
                        suggestions={knownGroups.filter((g) => g !== group?.name)}
                        placeholder="children (optional)"
                        invalid={!!rowErrors?.children}
                      />
                    )}
                  />
                  <Textarea
                    placeholder={"vars, one per line\nansible_user=admin"}
                    aria-label="Group vars"
                    rows={1}
                    className="min-h-8 font-mono text-xs"
                    {...form.register(`groups.${index}.vars` as never)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove group"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => groupFields.remove(index)}
                  >
                    <X className="size-4" />
                  </Button>
                  <FieldError className="text-xs sm:col-span-4" errors={[rowErrors?.name, rowErrors?.children]} />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => groupFields.append({ name: "", children: [], vars: "" })}
          >
            <Plus />
            Add group
          </Button>
          {unlistedHostGroups.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">or configure:</span>
              {unlistedHostGroups.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => groupFields.append({ name, children: [], vars: "" })}
                  className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed px-2 font-mono text-xs text-muted-foreground hover:border-solid hover:text-foreground"
                >
                  <Plus className="size-3" />
                  {name}
                </button>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
