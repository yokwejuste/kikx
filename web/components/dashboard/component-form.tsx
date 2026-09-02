"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentFormFields } from "@/components/dashboard/component-form-fields";
import { FileConflictDialog, type PendingFile } from "@/components/dashboard/file-conflict-dialog";
import { YamlPreview } from "@/components/dashboard/yaml-preview";
import { api, ApiClientError } from "@/lib/api-client";
import { useProject } from "@/lib/project-context";
import { defaultsFor, schemas, toRenderRequest, type FormValues } from "@/lib/component-form-utils";
import type { ComponentKind } from "@/lib/schemas";

export function ComponentForm({ kind }: { kind: ComponentKind }) {
  const { details, addFile, hasFile } = useProject();
  const [rendered, setRendered] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schemas[kind] as typeof schemas.deployment) as unknown as Resolver<FormValues>,
    defaultValues: defaultsFor(kind),
  });

  const previewMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.render(toRenderRequest(details?.namespace ?? "default", values)),
    onSuccess: (data) => setRendered(data.rendered),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Preview failed");
    },
  });

  const addMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.render(toRenderRequest(details?.namespace ?? "default", values)),
    onSuccess: (data, values) => {
      setRendered(data.rendered);
      const fileName = `${values.name}-${data.component}.${data.extension}`;
      if (hasFile(fileName)) {
        setPendingFile({ fileName, component: data.component, content: data.rendered });
        return;
      }
      addFile({ fileName, component: data.component, content: data.rendered });
      toast.success(`Added ${fileName}`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to render component");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <ComponentFormFields kind={kind} form={form} />

      <div className="flex gap-2 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={previewMutation.isPending}
          onClick={form.handleSubmit((values) => previewMutation.mutate(values))}
        >
          <Eye className="size-4" />
          {previewMutation.isPending ? "Rendering…" : "Preview"}
        </Button>
        <Button
          type="button"
          disabled={addMutation.isPending}
          onClick={form.handleSubmit((values) => addMutation.mutate(values))}
        >
          <PackagePlus className="size-4" />
          {addMutation.isPending ? "Rendering…" : "Add to project"}
        </Button>
      </div>

      <YamlPreview rendered={rendered} />

      <FileConflictDialog
        pendingFile={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={() => {
          if (pendingFile) {
            addFile(pendingFile);
            toast.success(`Replaced ${pendingFile.fileName}`);
          }
          setPendingFile(null);
        }}
      />
    </div>
  );
}
