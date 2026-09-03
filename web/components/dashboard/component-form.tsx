"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentFormFields } from "@/components/dashboard/component-form-fields";
import { FileConflictDialog } from "@/components/dashboard/file-conflict-dialog";
import { YamlPreview } from "@/components/dashboard/yaml-preview";
import { api, ApiClientError, type RenderedFile } from "@/lib/api-client";
import { useProject, type AddedComponent } from "@/lib/project-context";
import { defaultsFor, schemas, toRenderRequest, type FormValues } from "@/lib/component-form-utils";
import { toPresetComponent } from "@/lib/preset";
import { extractInventoryGroupNames } from "@/lib/inventory-utils";
import type { ComponentKind } from "@/lib/schemas";

export function ComponentForm({ kind }: { kind: ComponentKind }) {
  const { details, components, addComponent, conflictingFileNames } = useProject();
  const inventoryGroupNames = extractInventoryGroupNames(components);
  const [files, setFiles] = useState<RenderedFile[] | null>(null);
  const [pending, setPending] = useState<Omit<AddedComponent, "id"> | null>(null);
  const [conflicts, setConflicts] = useState<string[] | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schemas[kind] as typeof schemas.deployment) as unknown as Resolver<FormValues>,
    defaultValues: defaultsFor(kind),
  });

  const previewMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.render(toRenderRequest(details?.namespace ?? "default", values)),
    onSuccess: (data) => setFiles(data.files),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Preview failed");
    },
  });

  const addMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.render(toRenderRequest(details?.namespace ?? "default", values)),
    onSuccess: (data, values) => {
      setFiles(data.files);
      const recipe = toPresetComponent(details?.namespace ?? "default", values);
      const projectFiles = data.files.map((f) => ({
        fileName: f.path,
        component: data.component,
        content: f.content,
      }));
      const clashes = conflictingFileNames(projectFiles);
      if (clashes.length > 0) {
        setPending({ recipe, files: projectFiles });
        setConflicts(clashes);
        return;
      }
      addComponent(recipe, projectFiles);
      toast.success(`Added ${projectFiles.length} file(s)`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to render component");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <ComponentFormFields kind={kind} form={form} inventoryGroupNames={inventoryGroupNames} />

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

      <YamlPreview files={files} />

      <FileConflictDialog
        conflicts={conflicts}
        onCancel={() => {
          setPending(null);
          setConflicts(null);
        }}
        onConfirm={() => {
          if (pending) {
            addComponent(pending.recipe, pending.files);
            toast.success(`Replaced ${pending.files.length} file(s)`);
          }
          setPending(null);
          setConflicts(null);
        }}
      />
    </div>
  );
}
