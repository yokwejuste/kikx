"use client";

import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/dashboard/form-field";
import type { ComponentKind } from "@/lib/schemas";
import { K8S_KINDS, OS_IMAGES, type FormValues } from "@/lib/component-form-utils";

export function ComponentFormFields({
  kind,
  form,
}: {
  kind: ComponentKind;
  form: UseFormReturn<FormValues>;
}) {
  const isK8s = K8S_KINDS.has(kind);
  const labelFields = useFieldArray({ control: form.control, name: "labels" as never });
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
          <>
            <FormField
              label="Size"
              registration={reg("size")}
              error={errors.size}
              placeholder="s-2vcpu-4gb"
            />
            <Field data-invalid={!!errors.osImage}>
              <FieldLabel>OS image</FieldLabel>
              <Controller
                control={form.control}
                name={"osImage" as never}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an image" />
                    </SelectTrigger>
                    <SelectContent>
                      {OS_IMAGES[kind].map((image) => (
                        <SelectItem key={image.slug} value={image.slug}>
                          {image.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <FormField
              label="Count"
              type="number"
              min={1}
              registration={reg("count")}
              error={errors.count}
            />
          </>
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

      {isK8s && (
        <Field>
          <FieldLabel>Labels</FieldLabel>
          <div className="flex flex-col gap-2">
            {labelFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="key" {...form.register(`labels.${index}.key` as const)} />
                <Input placeholder="value" {...form.register(`labels.${index}.value` as const)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => labelFields.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => labelFields.append({ key: "", value: "" })}
            >
              <Plus className="size-3.5" />
              Add label
            </Button>
          </div>
        </Field>
      )}
    </>
  );
}
