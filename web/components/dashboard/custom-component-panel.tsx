"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, PackagePlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Panel } from "@/components/dashboard/panel";
import { FileConflictDialog, type PendingFile } from "@/components/dashboard/file-conflict-dialog";
import { YamlPreview } from "@/components/dashboard/yaml-preview";
import { api, ApiClientError, type RegistryItem } from "@/lib/api-client";
import { useProject } from "@/lib/project-context";

export function CustomComponentPanel() {
  const { details, addFile, hasFile } = useProject();
  const [reference, setReference] = useState("");
  const [item, setItem] = useState<RegistryItem | null>(null);
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [rendered, setRendered] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);

  const loadMutation = useMutation({
    mutationFn: () => api.inspectRegistryItem(reference),
    onSuccess: (data) => {
      setItem(data);
      setRendered(null);
      const defaults: Record<string, string> = {};
      for (const field of data.fields) {
        if (field.default) defaults[field.name] = field.default;
      }
      setValues(defaults);
    },
    onError: (error: unknown) => {
      setItem(null);
      toast.error(error instanceof ApiClientError ? error.message : "Failed to load that reference");
    },
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      api.render({ reference, name, fields: values, defaultNamespace: details?.namespace ?? "default" }),
    onSuccess: (data) => setRendered(data.rendered),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Preview failed");
    },
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.render({ reference, name, fields: values, defaultNamespace: details?.namespace ?? "default" }),
    onSuccess: (data) => {
      setRendered(data.rendered);
      const fileName = `${name}-${data.component}.${data.extension}`;
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
    <Panel
      title="Custom component"
      description="Point at any registry-item.json — a URL or a local path — and render it. No kikx update required."
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/r/aws-ec2.json or ./my-item.json"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!reference || loadMutation.isPending}
            onClick={() => loadMutation.mutate()}
          >
            <Search className="size-4" />
            {loadMutation.isPending ? "Loading…" : "Load"}
          </Button>
        </div>

        {item && (
          <>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{item.title || `${item.category}/${item.name}`}</p>
              {item.description && <p className="text-muted-foreground">{item.description}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-thing" />
              </Field>
              {item.fields.map((field) => (
                <Field key={field.name}>
                  <FieldLabel>
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </FieldLabel>
                  <Input
                    value={values[field.name] ?? ""}
                    placeholder={field.default ?? undefined}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>

            <div className="flex gap-2 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={!name || previewMutation.isPending}
                onClick={() => previewMutation.mutate()}
              >
                <Eye className="size-4" />
                {previewMutation.isPending ? "Rendering…" : "Preview"}
              </Button>
              <Button
                type="button"
                disabled={!name || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                <PackagePlus className="size-4" />
                {addMutation.isPending ? "Rendering…" : "Add to project"}
              </Button>
            </div>

            <YamlPreview rendered={rendered} />
          </>
        )}
      </div>

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
    </Panel>
  );
}
