"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { History } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { useErrorText, useValidationText } from "@/lib/i18n/use-error-text";
import { Button } from "@/components/ui/button";
import { ComponentFormFields } from "@/components/builder/editor/component-form-fields";
import type { FormContext } from "@/components/builder/editor/form-context";
import { EditorHeader } from "@/components/builder/editor/editor-header";
import { EditorIssues, type EditorChecks } from "@/components/builder/editor/editor-issues";
import { SaveBar } from "@/components/builder/editor/save-bar";
import { FileConflictDialog } from "@/components/builder/conflicts/file-conflict-dialog";
import { YamlPreview } from "@/components/builder/preview/yaml-preview";
import { firstError, hasDirtyField } from "@/components/builder/editor/form-state";
import { toProjectFiles } from "@/components/builder/editor/project-files";
import { useConflictGuard } from "@/components/builder/conflicts/use-conflict-guard";
import { useRenderPreview } from "@/components/builder/editor/use-render-preview";
import { useFormDraft } from "@/components/builder/editor/use-form-draft";
import { draftKey } from "@/lib/project/drafts";
import { api } from "@/lib/api/client";
import { componentId, useProject, type AddedComponent, type ProjectFile } from "@/lib/project/context";
import { defaultsFor, recipeToFormValues, schemas, toRenderRequest, type FormValues } from "@/lib/forms/component-forms";
import { toPresetComponent, type PresetComponent } from "@/lib/project/preset";
import { describeComponent, nextCatalogKind, type CatalogKind } from "@/lib/registry/catalog";
import type { ComponentKind } from "@/lib/registry/references";
import { projectDefaults } from "@/lib/registry/store";
import { Hint } from "@/components/common/hint";

export function ComponentEditor({
  kind,
  editing,
  context,
  checks,
  onSaved,
  onStartNew,
  onNext,
}: {
  kind: ComponentKind;
  editing: AddedComponent | null;
  context: FormContext;
  checks: EditorChecks;
  onSaved: (id: string) => void;
  onStartNew: () => void;
  onNext: (kind: CatalogKind) => void;
}) {
  const t = useTranslations("editor");
  const format = useFormatter();
  const text = useCatalogText();
  const errorText = useErrorText();
  const validationText = useValidationText();
  const { details, components, saveComponent, findConflicts } = useProject();
  const namespace = details?.namespace ?? projectDefaults().defaultNamespace;

  const [initial] = useState<FormValues>(() => {
    if (editing) return recipeToFormValues(editing.recipe) ?? defaultsFor(kind);
    const defaults = defaultsFor(kind);
    return defaults.component === "inventory" && details?.name ? { ...defaults, name: details.name } : defaults;
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schemas[kind] as typeof schemas.deployment) as unknown as Resolver<FormValues>,
    defaultValues: initial,
    mode: "onTouched",
  });

  const preview = useRenderPreview({ form, kind, namespace, initial });
  const draft = useFormDraft({ form, draftKey: draftKey(kind, editing?.id ?? null), initial });
  const liveConflicts = preview.files ? findConflicts(preview.files, editing?.id) : [];
  const [saving, setSaving] = useState(false);

  const commit = (recipe: PresetComponent, files: ProjectFile[]) => {
    draft.settle();
    const displaced = saveComponent(recipe, files, editing?.id);
    const { title } = text.describe(recipe);
    const next = editing ? null : nextCatalogKind(kind, components.map((c) => describeComponent(c.recipe).kind));
    toast.success(editing ? t("toasts.saved", { title }) : t("toasts.added", { title }), {
      description: displaced.length
        ? t("toasts.replaced", { count: displaced.length })
        : t("toasts.files", { count: files.length }),
      action: next ? { label: t("toasts.next", { label: text.entry(next).label }), onClick: () => onNext(next) } : undefined,
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
        toast.error(errorText(error, "editor.toasts.renderFailed"));
      } finally {
        setSaving(false);
      }
    },
    (errors) => {
      const first = firstError(errors);
      toast.error(t("toasts.attention"), {
        description: first ? `${first.path}: ${validationText(first.message)}` : t("toasts.attentionHint"),
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
      {editing && <EditorIssues checks={checks} currentId={editing.id} />}

      {draft.restoredAt !== null && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-6 py-2.5 text-sm">
          <History className="size-4 text-muted-foreground" />
          <span>
            {t("draft.restored", {
              date: format.dateTime(new Date(draft.restoredAt), { dateStyle: "medium", timeStyle: "short" }),
            })}
          </span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={draft.discard}>
            {t("draft.discard")}
          </Button>
        </div>
      )}

      <div className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
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
            onReset={draft.discard}
          />
        </div>

        <div data-teach="preview" className="flex min-w-0 flex-col gap-3 border-t p-6 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:self-start 2xl:overflow-y-auto 2xl:border-t-0 2xl:border-l">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t("preview.title")}</h3>
            <Hint as="span">{t("preview.live")}</Hint>
          </div>
          <YamlPreview
            files={preview.rendered}
            status={preview.status}
            error={preview.error}
            conflictPaths={new Set(liveConflicts.map((c) => c.fileName))}
          />
        </div>
      </div>

      <FileConflictDialog {...guard.dialogProps} />
    </div>
  );
}
