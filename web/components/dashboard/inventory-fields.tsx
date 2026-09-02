"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { FormValues } from "@/lib/component-form-utils";

export function InventoryFields({ form }: { form: UseFormReturn<FormValues> }) {
  const hostFields = useFieldArray({ control: form.control, name: "hosts" as never });

  return (
    <Field>
      <FieldLabel>Hosts</FieldLabel>
      <p className="-mt-1 text-xs text-muted-foreground">
        One host is enough for a single all-in-one server. Give hosts the same group name to
        put them under one Ansible group; different names create separate groups.
      </p>
      <div className="flex flex-col gap-3">
        {hostFields.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-3">
            <Input placeholder="group (e.g. all)" {...form.register(`hosts.${index}.group` as const)} />
            <Input placeholder="host name" {...form.register(`hosts.${index}.name` as const)} />
            <Input placeholder="203.0.113.10" {...form.register(`hosts.${index}.ansibleHost` as const)} />
            <Input placeholder="ssh user" {...form.register(`hosts.${index}.ansibleUser` as const)} />
            <Input
              type="number"
              placeholder="ssh port"
              {...form.register(`hosts.${index}.ansiblePort` as const)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="ssh key file (optional)"
                {...form.register(`hosts.${index}.sshKeyFile` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={hostFields.fields.length === 1}
                onClick={() => hostFields.remove(index)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1.5"
          onClick={() =>
            hostFields.append({
              group: "all",
              name: "",
              ansibleHost: "",
              ansibleUser: "root",
              ansiblePort: 22,
              sshKeyFile: "",
            })
          }
        >
          <Plus className="size-3.5" />
          Add host
        </Button>
      </div>
    </Field>
  );
}
