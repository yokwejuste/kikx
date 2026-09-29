"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ComponentFormFields } from "@/components/builder/editor/component-form-fields";
import type { FormContext } from "@/components/builder/editor/form-context";
import { EditorHeader } from "@/components/builder/editor/editor-header";
import { SaveBar } from "@/components/builder/editor/save-bar";
import { FileConflictDialog } from "@/components/builder/conflicts/file-conflict-dialog";
import { YamlPreview } from "@/components/builder/preview/yaml-preview";
import { firstError, hasDirtyField } from "@/components/builder/editor/form-state";
import { toProjectFiles } from "@/components/builder/editor/project-files";
import { useConflictGuard } from "@/components/builder/conflicts/use-conflict-guard";
import { useRenderPreview } from "@/components/builder/editor/use-render-preview";
import { api, ApiClientError } from "@/lib/api/client";
import { describeComponent } from "@/lib/registry/catalog";
import { componentId, useProject, type AddedComponent, type ProjectFile } from "@/lib/project/context";
import { defaultsFor, recipeToFormValues, schemas, toRenderRequest, type FormValues } from "@/lib/forms/component-forms";
import { toPresetComponent, type PresetComponent } from "@/lib/project/preset";
import type { ComponentKind } from "@/lib/registry/references";
import { projectDefaults } from "@/lib/registry/store";

export function ComponentEditor({
  kind,
  editing,
  context,
  onSaved,
  onStartNew,
}: {
  kind: ComponentKind;
  editing: AddedComponent | null;
  context: FormContext;
  onSaved: (id: string) => void;
  onStartNew: () => void;
}) {
  const { details, saveComponent, findConflicts } = useProject();
  const namespace = details?.namespace ?? projectDefaults().defaultNamespace;

  // The editor is keyed by kind + component, so initial values are computed once per mount.
  const [initial] = useState<FormValues>(() => {
    if (editing) return recipeToFormValues(editing.recipe) ?? defaultsFor(kind);
    const defaults = defaultsFor(kind);
    // "<project>-inventory.ini" reads better than the generic "inventory-inventory.ini".
    return defaults.component === "inventory" && details?.name ? { ...defaults, name: details.name } : defaults;
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schemas[kind] as typeof schemas.deployment) as unknown as Resolver<FormValues>,
    defaultValues: initial,
    mode: "onTouched",
  });

  const preview = useRenderPreview({ form, kind, namespace, initial });
  const liveConflicts = preview.files ? findConflicts(preview.files, editing?.id) : [];
  const [saving, setSaving] = useState(false);

  const commit = (recipe: PresetComponent, files: ProjectFile[]) => {
    const displaced = saveComponent(recipe, files, editing?.id);
    const { title } = describeComponent(recipe);
    toast.success(editing ? `Saved ${title}` : `Added ${title}`, {
      description: displaced.length
        ? `Replaced ${displaced.length} other component${displaced.length > 1 ? "s" : ""}.`
        : `${files.length} file${files.length === 1 ? "" : "s"} in the project.`,
    });
    onSaved(componentId(recipe));
  };
  const guard = useConflictGuard(commit, editing?.id);

  const submit = form.handleSubmit(
    async (values) => {
      setSaving(true);
      try {
        const data = await api.render(toRenderRequest(namespace, values));
        guard.save(toPresetComponent(namespace, values), toProjectFiles(data));
      } catch (error) {
        toast.error(error instanceof ApiClientError ? error.message : "Failed to render component");
      } finally {
        setSaving(false);
      }
    },
    (errors) => {
      const first = firstError(errors);
      toast.error("Some fields need attention", {
        description: first ? `${first.path}: ${first.message}` : "They're highlighted in the form.",
      });
    },
  );

  const dirty = hasDirtyField(form.formState.dirtyFields);

  return (
    <div
      className="rounded-xl border bg-card"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      }}
    >
      <EditorHeader kind={kind} editing={editing} previewFiles={preview.files} onStartNew={onStartNew} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-6 p-6"
      >
        <ComponentFormFields kind={kind} form={form} context={context} />
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>

      <SaveBar
        isEditing={!!editing}
        dirty={dirty}
        saving={saving}
        conflicts={liveConflicts}
        onSave={() => submit()}
        onReset={() => form.reset(initial)}
      />

      <div className="flex flex-col gap-3 border-t p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Preview</h3>
          <span className="text-xs text-muted-foreground">Updates as you type</span>
        </div>
        <YamlPreview
          files={preview.rendered}
          status={preview.status}
          error={preview.error}
          conflictPaths={new Set(liveConflicts.map((c) => c.fileName))}
        />
      </div>

      <FileConflictDialog {...guard.dialogProps} />
    </div>
  );
}
