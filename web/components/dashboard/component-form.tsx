"use client";

import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { YamlPreview } from "@/components/dashboard/yaml-preview";
import { api, ApiClientError, type AddRequest } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  deploymentFormSchema,
  serviceFormSchema,
  ingressFormSchema,
  type ComponentKind,
} from "@/lib/schemas";
import type { z } from "zod";

const schemas = {
  deployment: deploymentFormSchema,
  service: serviceFormSchema,
  ingress: ingressFormSchema,
};

type DeploymentValues = z.infer<typeof deploymentFormSchema>;
type ServiceValues = z.infer<typeof serviceFormSchema>;
type IngressValues = z.infer<typeof ingressFormSchema>;
type FormValues = DeploymentValues | ServiceValues | IngressValues;

function defaultsFor(kind: ComponentKind): FormValues {
  const shared = { name: "", namespace: "", labels: [] as { key: string; value: string }[] };
  switch (kind) {
    case "deployment":
      return { component: "deployment", ...shared, image: "", replicas: 1, port: 80 };
    case "service":
      return { component: "service", ...shared, port: 80, targetPort: undefined };
    case "ingress":
      return { component: "ingress", ...shared, host: "", path: "/", service: "", port: 80 };
  }
}

function toAddRequest(dir: string, values: FormValues, force: boolean): AddRequest {
  const base: AddRequest = {
    projectDir: dir,
    component: values.component,
    name: values.name,
    namespace: values.namespace || undefined,
    labels: values.labels,
    force,
  };
  if (values.component === "deployment") {
    return { ...base, image: values.image, replicas: values.replicas, port: values.port };
  }
  if (values.component === "service") {
    return { ...base, port: values.port, targetPort: values.targetPort };
  }
  return {
    ...base,
    host: values.host || undefined,
    path: values.path,
    service: values.service || undefined,
    port: values.port,
  };
}

export function ComponentForm({ dir, kind }: { dir: string; kind: ComponentKind }) {
  const queryClient = useQueryClient();
  const [rendered, setRendered] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schemas[kind] as typeof deploymentFormSchema) as unknown as Resolver<FormValues>,
    defaultValues: defaultsFor(kind),
  });
  const labelFields = useFieldArray({ control: form.control, name: "labels" });

  const previewMutation = useMutation({
    mutationFn: (values: FormValues) => api.previewComponent(toAddRequest(dir, values, false)),
    onSuccess: (data) => setRendered(data.rendered),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Preview failed");
    },
  });

  const addMutation = useMutation({
    mutationFn: (values: FormValues) => api.addComponent(toAddRequest(dir, values, false)),
    onSuccess: (data) => {
      setRendered(data.rendered);
      toast.success(`Vendored ${data.outputPath}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(dir) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiClientError && error.status === 409) {
        setConflictOpen(true);
        return;
      }
      toast.error(error instanceof ApiClientError ? error.message : "Failed to vendor component");
    },
  });

  const overwriteMutation = useMutation({
    mutationFn: (values: FormValues) => api.addComponent(toAddRequest(dir, values, true)),
    onSuccess: (data) => {
      setRendered(data.rendered);
      toast.success(`Overwrote ${data.outputPath}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(dir) });
      setConflictOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to overwrite component");
      setConflictOpen(false);
    },
  });

  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel>Name</FieldLabel>
          <Input {...form.register("name")} placeholder="my-app" />
          <FieldError errors={[errors.name]} />
        </Field>

        {kind === "deployment" && (
          <>
            <Field data-invalid={!!errors.image}>
              <FieldLabel>Image</FieldLabel>
              <Input {...form.register("image" as never)} placeholder="nginx:1.27" />
              <FieldError errors={[errors.image]} />
            </Field>
            <Field data-invalid={!!errors.replicas}>
              <FieldLabel>Replicas</FieldLabel>
              <Input type="number" min={1} {...form.register("replicas" as never)} />
              <FieldError errors={[errors.replicas]} />
            </Field>
          </>
        )}

        {kind === "ingress" && (
          <>
            <Field data-invalid={!!errors.host}>
              <FieldLabel>Host (defaults to &lt;name&gt;.example.com)</FieldLabel>
              <Input {...form.register("host" as never)} placeholder="my-app.example.com" />
              <FieldError errors={[errors.host]} />
            </Field>
            <Field data-invalid={!!errors.path}>
              <FieldLabel>Path</FieldLabel>
              <Input {...form.register("path" as never)} placeholder="/" />
              <FieldError errors={[errors.path]} />
            </Field>
            <Field data-invalid={!!errors.service}>
              <FieldLabel>Backend service (defaults to name)</FieldLabel>
              <Input {...form.register("service" as never)} placeholder="my-app" />
              <FieldError errors={[errors.service]} />
            </Field>
          </>
        )}

        <Field data-invalid={!!errors.port}>
          <FieldLabel>Port</FieldLabel>
          <Input type="number" min={1} max={65535} {...form.register("port" as never)} />
          <FieldError errors={[errors.port]} />
        </Field>

        {kind === "service" && (
          <Field data-invalid={!!errors.targetPort}>
            <FieldLabel>Target port (defaults to port)</FieldLabel>
            <Input type="number" min={1} max={65535} {...form.register("targetPort" as never)} />
            <FieldError errors={[errors.targetPort]} />
          </Field>
        )}

        <Field data-invalid={!!errors.namespace}>
          <FieldLabel>Namespace override (optional)</FieldLabel>
          <Input {...form.register("namespace")} placeholder="default" />
          <FieldError errors={[errors.namespace]} />
        </Field>

        <Field>
          <FieldLabel>Labels</FieldLabel>
          <div className="flex flex-col gap-2">
            {labelFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="key"
                  {...form.register(`labels.${index}.key` as const)}
                />
                <Input
                  placeholder="value"
                  {...form.register(`labels.${index}.value` as const)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => labelFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => labelFields.append({ key: "", value: "" })}
            >
              Add label
            </Button>
          </div>
        </Field>
      </FieldGroup>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={previewMutation.isPending}
          onClick={form.handleSubmit((values) => previewMutation.mutate(values))}
        >
          {previewMutation.isPending ? "Rendering…" : "Preview"}
        </Button>
        <Button
          type="button"
          disabled={addMutation.isPending}
          onClick={form.handleSubmit((values) => addMutation.mutate(values))}
        >
          {addMutation.isPending ? "Vendoring…" : "Vendor this file"}
        </Button>
      </div>

      <YamlPreview rendered={rendered} />

      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File already exists</DialogTitle>
            <DialogDescription>
              A vendored file for this component and name already exists. Overwrite it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={overwriteMutation.isPending}
              onClick={form.handleSubmit((values) => overwriteMutation.mutate(values))}
            >
              Overwrite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
