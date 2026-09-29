"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, type View } from "@/components/builder/dashboard-header";
import { ComponentCatalog } from "@/components/builder/catalog/component-catalog";
import { ComponentEditor } from "@/components/builder/editor/component-editor";
import { CustomComponentPanel } from "@/components/builder/editor/custom-component-panel";
import { buildFormContext } from "@/components/builder/editor/form-context";
import { toProjectFiles } from "@/components/builder/editor/project-files";
import { ProjectPanel } from "@/components/builder/project/project-panel";
import { ChecksPanel } from "@/components/builder/project/checks-panel";
import type { IssueCounts } from "@/components/builder/project/severity";
import { ProjectDiagram } from "@/components/builder/diagram/project-diagram";
import { useProject, type AddedComponent } from "@/lib/project/context";
import { CATALOG, describeComponent, type CatalogKind } from "@/lib/registry/catalog";
import { loadBuilderState, saveBuilderState } from "@/lib/project/drafts";
import { checkProject, issuesByComponent } from "@/lib/project/checks";
import { toPresetComponent } from "@/lib/project/preset";
import { defaultsFor, type FormValues } from "@/lib/forms/component-forms";
import { api, ApiClientError } from "@/lib/api/client";
import { pluralize } from "@/lib/format";
import { useFirstVisitTour } from "@/lib/tour/use-tour";

interface Selection {
  kind: CatalogKind;
  editingId: string | null;
  nonce: number;
}

const VIEWS: View[] = ["build", "diagram", "checks"];
const KINDS = new Set<string>(CATALOG.flatMap((stage) => stage.entries.map((entry) => entry.kind)));

function restoredBuilder(): { view: View; selection: Selection } {
  const stored = loadBuilderState();
  const view = VIEWS.find((candidate) => candidate === stored?.view) ?? "build";
  const kind = stored && KINDS.has(stored.kind) ? (stored.kind as CatalogKind) : "inventory";
  return { view, selection: { kind, editingId: stored?.editingId ?? null, nonce: 0 } };
}

export function Dashboard() {
  const { details, components, saveComponent } = useProject();
  const [restored] = useState(restoredBuilder);
  const [view, setView] = useState<View>(restored.view);
  const [selection, setSelection] = useState<Selection>(restored.selection);
  const editorTop = useRef<HTMLDivElement>(null);

  const issues = useMemo(() => checkProject(components), [components]);
  const issuesFor = useMemo(() => issuesByComponent(issues), [issues]);
  const issueCounts = useMemo(() => {
    const counts: IssueCounts = { error: 0, warning: 0, info: 0 };
    for (const issue of issues) counts[issue.severity]++;
    return counts;
  }, [issues]);
  const context = useMemo(() => buildFormContext(components), [components]);
  useFirstVisitTour("builder", Boolean(details));

  useEffect(() => {
    saveBuilderState({ view, kind: selection.kind, editingId: selection.editingId });
  }, [view, selection.kind, selection.editingId]);

  if (!details) return null;

  const editing = selection.editingId ? (components.find((c) => c.id === selection.editingId) ?? null) : null;

  const select = (kind: CatalogKind, editingId: string | null = null) => {
    setSelection((prev) => ({ kind, editingId, nonce: prev.nonce + 1 }));
    setView("build");
    requestAnimationFrame(() => {
      const top = editorTop.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) editorTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const openComponent = (component: AddedComponent) => select(describeComponent(component.recipe).kind, component.id);

  const scaffoldRoles = async (roles: string[]) => {
    try {
      for (const role of roles) {
        const recipe = toPresetComponent(details.namespace, { ...defaultsFor("role"), name: role } as FormValues);
        const rendered = await api.render({ ...recipe, labels: [], defaultNamespace: details.namespace });
        saveComponent(recipe, toProjectFiles(rendered));
      }
      toast.success(`Scaffolded ${pluralize(roles.length, "role")}`, {
        description: "Empty tasks/defaults/handlers/meta — open one to see its files.",
      });
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Couldn't scaffold those roles");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-6 py-6">
      <DashboardHeader
        details={details}
        components={components}
        view={view}
        onViewChange={setView}
        issueCounts={issueCounts}
      />

      {view === "diagram" && <ProjectDiagram onOpen={openComponent} />}
      {view === "checks" && (
        <ChecksPanel issues={issues} components={components} onOpen={openComponent} onScaffoldRoles={scaffoldRoles} />
      )}

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_280px] lg:items-start" hidden={view !== "build"}>
        <aside data-tour="catalog" className="lg:sticky lg:top-6">
          <ComponentCatalog components={components} selected={selection.kind} onSelect={(kind) => select(kind)} />
        </aside>

        <div ref={editorTop} data-tour="editor" className="min-w-0 scroll-mt-6">
          {selection.kind === "custom" ? (
            <div className="flex flex-col gap-3">
              {editing && (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  <span className="font-mono text-foreground">{editing.recipe.reference}</span> is a custom registry item —
                  load it again below with the same name to re-render it.
                </p>
              )}
              <CustomComponentPanel
                key={selection.nonce}
                onSaved={(id) => setSelection((prev) => ({ ...prev, editingId: id }))}
              />
            </div>
          ) : (
            <ComponentEditor
              key={`${selection.kind}:${editing?.id ?? "new"}:${selection.nonce}`}
              kind={selection.kind}
              editing={editing}
              context={context}
              onSaved={(id) => select(selection.kind, id)}
              onStartNew={() => select(selection.kind)}
            />
          )}
        </div>

        <aside data-tour="project" className="lg:sticky lg:top-6">
          <ProjectPanel
            activeId={editing?.id ?? null}
            issuesFor={issuesFor}
            issueCounts={issueCounts}
            onEdit={openComponent}
            onShowChecks={() => setView("checks")}
          />
        </aside>
      </div>
    </div>
  );
}
