"use client";

import { useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, PackagePlus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useErrorText } from "@/lib/i18n/use-error-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Panel } from "@/components/common/panel";
import { HelpTip } from "@/components/common/help-tip";
import { FileConflictDialog } from "@/components/builder/conflicts/file-conflict-dialog";
import { YamlPreview } from "@/components/builder/preview/yaml-preview";
import { toProjectFiles } from "@/components/builder/editor/project-files";
import { useConflictGuard } from "@/components/builder/conflicts/use-conflict-guard";
import { api, type RegistryItem, type RenderedFile } from "@/lib/api/client";
import { componentId, useProject, type ProjectFile } from "@/lib/project/context";
import type { PresetComponent } from "@/lib/project/preset";
import { projectDefaults } from "@/lib/registry/store";

export function CustomComponentPanel({ onSaved }: { onSaved?: (id: string) => void }) {
  const t = useTranslations("custom");
  const errorText = useErrorText();
  const { details, saveComponent } = useProject();
  const fieldId = useId();
  const [reference, setReference] = useState("");
  const [item, setItem] = useState<RegistryItem | null>(null);
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<RenderedFile[] | null>(null);

  const commit = (recipe: PresetComponent, projectFiles: ProjectFile[]) => {
    const displaced = saveComponent(recipe, projectFiles);
    toast.success(displaced.length ? t("replaced", { count: displaced.length }) : t("added", { count: projectFiles.length }));
    onSaved?.(componentId(recipe));
  };
  const guard = useConflictGuard(commit);

  const render = () =>
    api.render({ reference, name, fields: values, defaultNamespace: details?.namespace ?? projectDefaults().defaultNamespace });

  const loadMutation = useMutation({
    mutationFn: () => api.inspectRegistryItem(reference),
    onSuccess: (data) => {
      setItem(data);
      setFiles(null);
      const defaults: Record<string, string> = {};
      for (const field of data.fields) {
        if (field.default) defaults[field.name] = field.default;
      }
      setValues(defaults);
    },
    onError: (error: unknown) => {
      setItem(null);
      toast.error(errorText(error, "custom.loadFailed"));
    },
  });

  const previewMutation = useMutation({
    mutationFn: render,
    onSuccess: (data) => setFiles(data.files),
    onError: (error: unknown) => {
      toast.error(errorText(error, "custom.previewFailed"));
    },
  });

  const addMutation = useMutation({
    mutationFn: render,
    onSuccess: (data) => {
      setFiles(data.files);
      guard.save({ reference, name, fields: values, labels: {} }, toProjectFiles(data));
    },
    onError: (error: unknown) => {
      toast.error(errorText(error, "editor.toasts.renderFailed"));
    },
  });

  return (
    <Panel
      title={t("title")}
      description={t("body")}
      action={<HelpTip term="registryItem" />}
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-2">
          <Input
            name="reference"
            aria-label={t("placeholder")}
            placeholder={t("placeholder")}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            disabled={!reference || loadMutation.isPending}
            onClick={() => loadMutation.mutate()}
          >
            <Search className="size-4" />
            {loadMutation.isPending ? t("loading") : t("load")}
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
                <FieldLabel htmlFor={`${fieldId}-name`}>{t("name")}</FieldLabel>
                <Input id={`${fieldId}-name`} name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-thing" />
              </Field>
              {item.fields.map((field) => (
                <Field key={field.name}>
                  <FieldLabel htmlFor={`${fieldId}-${field.name}`}>
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-${field.name}`}
                    name={field.name}
                    value={values[field.name] ?? ""}
                    placeholder={field.default ?? undefined}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>

            <div className="flex gap-2 border-t pt-6">
              <Button
                variant="outline"
                disabled={!name || previewMutation.isPending}
                onClick={() => previewMutation.mutate()}
              >
                <Eye className="size-4" />
                {previewMutation.isPending ? t("rendering") : t("preview")}
              </Button>
              <Button
                disabled={!name || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                <PackagePlus className="size-4" />
                {addMutation.isPending ? t("rendering") : t("add")}
              </Button>
            </div>

            <YamlPreview files={files} status={previewMutation.isPending ? "loading" : "ready"} />
          </>
        )}
      </div>

      <FileConflictDialog {...guard.dialogProps} />
    </Panel>
  );
}
