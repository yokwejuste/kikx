"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useErrorText } from "@/lib/i18n/use-error-text";
import { DashboardHeader, type View } from "@/components/builder/dashboard-header";
import { ComponentCatalog } from "@/components/builder/catalog/component-catalog";
import { CatalogSheet } from "@/components/builder/catalog/catalog-sheet";
import { ComponentEditor } from "@/components/builder/editor/component-editor";
import { CustomComponentPanel } from "@/components/builder/editor/custom-component-panel";
import { buildFormContext } from "@/components/builder/editor/form-context";
import { toProjectFiles } from "@/components/builder/editor/project-files";
import { ProjectPanel } from "@/components/builder/project/project-panel";
import { ProjectSheet } from "@/components/builder/project/project-sheet";
import { ChecksPanel } from "@/components/builder/project/checks-panel";
import { GettingStarted } from "@/components/builder/project/getting-started";
import type { IssueCounts } from "@/components/builder/project/severity";
import { EmptyProjectStart } from "@/components/builder/start/empty-project-start";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/common/spinner";
import { useProject, type AddedComponent } from "@/lib/project/context";
import { CATALOG, describeComponent, type CatalogKind } from "@/lib/registry/catalog";
import { loadBuilderState, saveBuilderState } from "@/lib/project/drafts";
import { checkProject, issuesByComponent } from "@/lib/project/checks";
import { fieldFormat } from "@/lib/registry/store";
import { toPresetComponent } from "@/lib/project/preset";
import { defaultsFor, type FormValues } from "@/lib/forms/component-forms";
import { api } from "@/lib/api/client";
import { siteHeaderBottom } from "@/lib/layout/site-header";
import { closeTour, useFirstVisitTour } from "@/lib/tour/use-tour";
import { usePhoneWarningOpen } from "@/components/builder/phone-warning";

const ProjectDiagram = dynamic(
  () => import("@/components/builder/diagram/project-diagram").then((module) => module.ProjectDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-canvas-tall items-center justify-center rounded-xl border">
        <Spinner className="text-muted-foreground" />
      </div>
    ),
  },
);

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
  const t = useTranslations("builder");
  const errorText = useErrorText();
  const { details, components, saveComponent } = useProject();
  const [restored] = useState(restoredBuilder);
  const [view, setView] = useState<View>(restored.view);
  const [selection, setSelection] = useState<Selection>(restored.selection);
  const editorTop = useRef<HTMLDivElement>(null);

  const issues = useMemo(() => checkProject(components, fieldFormat), [components]);
  const issuesFor = useMemo(() => issuesByComponent(issues), [issues]);
  const issueCounts = useMemo(() => {
    const counts: IssueCounts = { error: 0, warning: 0, info: 0 };
    for (const issue of issues) counts[issue.severity]++;
    return counts;
  }, [issues]);
  const context = useMemo(() => buildFormContext(components), [components]);
  const phoneWarningOpen = usePhoneWarningOpen();
  useFirstVisitTour("builder", Boolean(details) && !phoneWarningOpen && view === "build");

  useEffect(() => closeTour, [view]);

  useEffect(() => {
    saveBuilderState({ view, kind: selection.kind, editingId: selection.editingId });
  }, [view, selection.kind, selection.editingId]);

  if (!details) return null;

  const starting = components.length === 0 && selection.nonce === 0;
  const editing = selection.editingId ? (components.find((c) => c.id === selection.editingId) ?? null) : null;

  const select = (kind: CatalogKind, editingId: string | null = null) => {
    setSelection((prev) => ({ kind, editingId, nonce: prev.nonce + 1 }));
    setView("build");
    requestAnimationFrame(() => {
      const top = editorTop.current?.getBoundingClientRect().top ?? 0;
      if (top < siteHeaderBottom()) editorTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const openComponent = (component: AddedComponent) => select(describeComponent(component.recipe).kind, component.id);
  const projectPanel = {
    activeId: editing?.id ?? null,
    issuesFor,
    issueCounts,
    onEdit: openComponent,
    onShowChecks: () => setView("checks"),
  };

  const scaffoldRoles = async (roles: string[]) => {
    try {
      for (const role of roles) {
        const recipe = toPresetComponent(details.namespace, { ...defaultsFor("role"), name: role } as FormValues);
        const rendered = await api.render({ ...recipe, labels: [], defaultNamespace: details.namespace });
        saveComponent(recipe, toProjectFiles(rendered));
      }
      toast.success(t("scaffolded", { count: roles.length }), { description: t("scaffoldedDetail") });
    } catch (error) {
      toast.error(errorText(error, "builder.scaffoldFailed"));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-builder flex-1 flex-col gap-6 px-6 py-6">
      <DashboardHeader
        details={details}
        components={components}
        view={view}
        onViewChange={setView}
        issueCounts={issueCounts}
      >
        {view === "build" && (
          <div className="hidden 2xl:block">
            <ProjectSheet {...projectPanel} onSelect={(kind) => select(kind)} />
          </div>
        )}
      </DashboardHeader>

      {view === "diagram" && <ProjectDiagram onOpen={openComponent} />}
      {view === "checks" && (
        <ChecksPanel issues={issues} components={components} onOpen={openComponent} onScaffoldRoles={scaffoldRoles} />
      )}

      <div
        className="grid gap-6 lg:grid-cols-builder lg:items-start xl:grid-cols-builder-wide 2xl:grid-cols-builder"
        hidden={view !== "build"}
      >
        <aside
          data-tour="catalog"
          className="hidden lg:sticky lg:top-sticky-offset lg:row-span-2 lg:block lg:max-h-sticky lg:overflow-y-auto xl:row-span-1"
        >
          <ComponentCatalog components={components} selected={starting ? null : selection.kind} onSelect={(kind) => select(kind)} />
        </aside>

        <div className="lg:hidden">
          <CatalogSheet components={components} selected={starting ? null : selection.kind} onSelect={(kind) => select(kind)} />
        </div>

        <div ref={editorTop} data-tour="editor" className="min-w-0 scroll-mt-6">
          {starting ? (
            <EmptyProjectStart onSelect={(kind) => select(kind)} />
          ) : selection.kind === "custom" ? (
            <div className="flex flex-col gap-3">
              {editing && (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  {t.rich("customNotice", {
                    reference: editing.recipe.reference,
                    code: (chunks) => <span className="font-mono text-foreground">{chunks}</span>,
                  })}
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
              checks={{ issues: issuesFor.get(editing?.id ?? "") ?? [], onOpen: openComponent, onScaffoldRoles: scaffoldRoles }}
              onSaved={(id) => select(selection.kind, id)}
              onStartNew={() => select(selection.kind)}
              onNext={(kind) => select(kind)}
            />
          )}
        </div>

        <aside data-tour="project" className="flex flex-col gap-3 lg:col-start-2 xl:sticky xl:top-sticky-offset xl:col-start-3 xl:row-start-1 2xl:hidden">
          <GettingStarted issueCounts={issueCounts} onSelect={(kind) => select(kind)} onShowChecks={() => setView("checks")} />
          <ProjectPanel {...projectPanel} />
        </aside>
      </div>
    </div>
  );
}
