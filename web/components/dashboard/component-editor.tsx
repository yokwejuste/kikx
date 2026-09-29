"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileWarning, PackagePlus, Plus, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComponentFormFields, type FormContext } from "@/components/dashboard/component-form-fields";
import { FileConflictDialog } from "@/components/dashboard/file-conflict-dialog";
import { YamlPreview, type PreviewStatus } from "@/components/dashboard/yaml-preview";
import { api, ApiClientError, type RenderResponse } from "@/lib/api-client";
import { catalogEntry, describeComponent } from "@/lib/component-catalog";
import { componentId, useProject, type AddedComponent, type FileConflict, type ProjectFile } from "@/lib/project-context";
import { defaultsFor, recipeToFormValues, schemas, toRenderRequest, type FormValues } from "@/lib/component-form-utils";
import { toPresetComponent, type PresetComponent } from "@/lib/preset";
import type { ComponentKind } from "@/lib/schemas";
import { projectDefaults } from "@/lib/registry";

const PREVIEW_DEBOUNCE_MS = 350;

function toProjectFiles(data: RenderResponse): ProjectFile[] {
  return data.files.map((f) => ({ fileName: f.path, component: data.component, content: f.content }));
}

/** The first leaf error in react-hook-form's nested error tree, with a readable path like "hosts 3 › name". */
function firstError(node: unknown, path: string[] = []): { path: string; message: string } | null {
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  if (typeof record.message === "string" && record.message) {
    return { path: path.map((p) => (/^\d+$/.test(p) ? String(Number(p) + 1) : p)).join(" › ") || "form", message: record.message };
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === "ref" || key === "type") continue;
    const found = firstError(child, [...path, key]);
    if (found) return found;
  }
  return null;
}

function hasDirtyField(node: unknown): boolean {
  if (node === true) return true;
  if (Array.isArray(node)) return node.some(hasDirtyField);
  if (node && typeof node === "object") return Object.values(node).some(hasDirtyField);
  return false;
}

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
  const namespace = details?.namespace ?? projectDefaults().defaultNamespace;  const entry = catalogEntry(kind);
  const Icon = entry.icon;

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

  // Debounce the live values so the preview re-renders once typing pauses, not per keystroke.
  const serialized = JSON.stringify(useWatch({ control: form.control }) ?? null);
  const [draft, setDraft] = useState<FormValues>(initial);
  useEffect(() => {
    const timer = setTimeout(() => setDraft(JSON.parse(serialized) as FormValues), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [serialized]);

  const request = useMemo(() => {
    const parsed = schemas[kind].safeParse(draft);
    return parsed.success ? toRenderRequest(namespace, parsed.data as FormValues) : null;
  }, [draft, kind, namespace]);

  const preview = useQuery({
    queryKey: ["render", request],
    queryFn: () => api.render(request!),
    enabled: !!request,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });

  const previewFiles = preview.data ? toProjectFiles(preview.data) : null;
  const liveConflicts = previewFiles ? findConflicts(previewFiles, editing?.id) : [];
  const status: PreviewStatus = !request
    ? "invalid"
    : preview.isFetching
      ? "loading"
      : preview.isError
        ? "error"
        : "ready";
  const previewError =
    preview.error instanceof ApiClientError ? preview.error.message : preview.error ? "Render failed" : undefined;

  const [pending, setPending] = useState<{ recipe: PresetComponent; files: ProjectFile[]; conflicts: FileConflict[] } | null>(
    null,
  );
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

  const submit = form.handleSubmit(
    async (values) => {
      setSaving(true);
      try {
        const data = await api.render(toRenderRequest(namespace, values));
        const recipe = toPresetComponent(namespace, values);
        const files = toProjectFiles(data);
        const conflicts = findConflicts(files, editing?.id);
        if (conflicts.length > 0) setPending({ recipe, files, conflicts });
        else commit(recipe, files);
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

  // isDirty can report true for untouched field arrays; the per-field map is reliable.
  const dirty = hasDirtyField(form.formState.dirtyFields);
  const writes = previewFiles?.length
    ? previewFiles.length === 1
      ? previewFiles[0].fileName
      : `${previewFiles.length} files`
    : entry.writes;

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
      <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">
              {editing ? (
                <>
                  Editing {entry.label} · <span className="font-mono">{describeComponent(editing.recipe).title}</span>
                </>
              ) : (
                `New ${entry.label.toLowerCase()}`
              )}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{entry.summary}.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="max-w-56 truncate font-mono text-xs font-normal" title={writes}>
            → {writes}
          </Badge>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={onStartNew}>
              <Plus />
              New
            </Button>
          )}
        </div>
      </div>

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

      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {liveConflicts.length > 0 && (
          <p className="flex items-start gap-2 text-xs">
            <FileWarning className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Saving replaces{" "}
              {liveConflicts.map((c, i) => (
                <span key={`${c.owner.id}:${c.fileName}`}>
                  {i > 0 && ", "}
                  <code className="font-mono">{c.fileName}</code>
                </span>
              ))}{" "}
              — currently from{" "}
              {Array.from(new Set(liveConflicts.map((c) => describeComponent(c.owner.recipe).title))).join(", ")}.
            </span>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={saving} onClick={() => submit()}>
            {editing ? <Save /> : <PackagePlus />}
            {saving ? "Rendering…" : editing ? "Save changes" : "Add to project"}
          </Button>
          {dirty && (
            <Button type="button" variant="ghost" onClick={() => form.reset(initial)}>
              <Undo2 />
              {editing ? "Discard changes" : "Reset"}
            </Button>
          )}
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
            {editing && !dirty ? "No unsaved changes" : "⌘/Ctrl + Enter to save"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Preview</h3>
          <span className="text-xs text-muted-foreground">Updates as you type</span>
        </div>
        <YamlPreview
          files={preview.data?.files ?? null}
          status={status}
          error={previewError}
          conflictPaths={new Set(liveConflicts.map((c) => c.fileName))}
        />
      </div>

      <FileConflictDialog
        conflicts={pending?.conflicts ?? null}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) commit(pending.recipe, pending.files);
          setPending(null);
        }}
      />
    </div>
  );
}
