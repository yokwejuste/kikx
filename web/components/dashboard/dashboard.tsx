"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, Download, Info, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentCatalog } from "@/components/dashboard/component-catalog";
import { ComponentEditor } from "@/components/dashboard/component-editor";
import { CustomComponentPanel } from "@/components/dashboard/custom-component-panel";
import { ProjectPanel } from "@/components/dashboard/project-panel";
import { ProjectDiagram } from "@/components/dashboard/project-diagram";
import { ChecksPanel } from "@/components/dashboard/checks-panel";
import type { FormContext } from "@/components/dashboard/component-form-fields";
import { useProject, type AddedComponent } from "@/lib/project-context";
import { describeComponent, type CatalogKind } from "@/lib/component-catalog";
import { checkProject, issuesByComponent } from "@/lib/project-checks";
import { extractInventoryGroupNames } from "@/lib/inventory-utils";
import { toPresetComponent } from "@/lib/preset";
import {
  defaultsFor,
  type FormValues,
  extractAvailableRoleNames,
  extractReferencedRoleNames,
  playbookPath,
  playsFromRecipe,
} from "@/lib/component-form-utils";
import { downloadProjectZip } from "@/lib/download";
import { api, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

type View = "build" | "diagram" | "checks";

interface Selection {
  kind: CatalogKind;
  editingId: string | null;
  /** Bumped to remount the editor with fresh values (after saving, or "New"). */
  nonce: number;
}

export function Dashboard() {
  const { details, components, saveComponent } = useProject();
  const [view, setView] = useState<View>("build");
  const [selection, setSelection] = useState<Selection>({ kind: "inventory", editingId: null, nonce: 0 });
  const [downloading, setDownloading] = useState(false);
  const editorTop = useRef<HTMLDivElement>(null);

  const issues = useMemo(() => checkProject(components), [components]);
  const issuesFor = useMemo(() => issuesByComponent(issues), [issues]);
  const issueCounts = useMemo(
    () => ({
      error: issues.filter((i) => i.severity === "error").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    }),
    [issues],
  );

  const context: FormContext = useMemo(() => {
    const roles = new Set([...extractAvailableRoleNames(components), ...extractReferencedRoleNames(components)]);
    return {
      groupNames: extractInventoryGroupNames(components),
      roleSuggestions: Array.from(roles),
      availablePlaybooks: components
        .filter((c) => c.recipe.reference === "ansible/playbook")
        .map((c) => ({
          name: playsFromRecipe(c.recipe)[0]?.name || c.recipe.name,
          path: playbookPath(c.recipe.name, c.recipe.fields.folder),
        })),
      serviceNames: components.filter((c) => c.recipe.reference === "k8s/service").map((c) => c.recipe.name),
    };
  }, [components]);

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
        saveComponent(
          recipe,
          rendered.files.map((f) => ({ fileName: f.path, component: rendered.component, content: f.content })),
        );
      }
      toast.success(`Scaffolded ${roles.length} role${roles.length > 1 ? "s" : ""}`, {
        description: "Empty tasks/defaults/handlers/meta — open one to see its files.",
      });
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Couldn't scaffold those roles");
    }
  };
  const attention = issueCounts.error + issueCounts.warning;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-semibold tracking-tight">{details.name}</h1>
          <div className="hidden items-center gap-1.5 sm:flex">
            <Badge variant="secondary" className="font-mono text-xs font-normal" title="Default Kubernetes namespace">
              ns: {details.namespace}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs font-normal" title="Output directory">
              {details.outputDir}/
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="build">Build</TabsTrigger>
              <TabsTrigger value="diagram">Architecture</TabsTrigger>
              <TabsTrigger value="checks" className="gap-1.5">
                Checks
                {attention > 0 ? (
                  <span
                    className={
                      issueCounts.error > 0
                        ? "flex items-center gap-0.5 text-destructive"
                        : "flex items-center gap-0.5 text-foreground"
                    }
                  >
                    {issueCounts.error > 0 ? <CircleAlert className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                    <span className="tabular-nums">{attention}</span>
                  </span>
                ) : issueCounts.info > 0 ? (
                  <Info className="size-3.5 text-muted-foreground" />
                ) : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            disabled={components.length === 0 || downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadProjectZip(details, components);
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Download />
            {downloading ? "Zipping…" : "Download .zip"}
          </Button>
          <Link href="/" className="px-2 text-sm text-muted-foreground hover:text-foreground">
            Start over
          </Link>
        </div>
      </div>

      {view === "diagram" && <ProjectDiagram onOpen={openComponent} />}
      {view === "checks" && <ChecksPanel issues={issues} components={components} onOpen={openComponent} onScaffoldRoles={scaffoldRoles} />}

      <div
        className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_280px] lg:items-start"
        hidden={view !== "build"}
      >
        <aside className="lg:sticky lg:top-6">
          <ComponentCatalog components={components} selected={selection.kind} onSelect={(kind) => select(kind)} />
        </aside>

        <div ref={editorTop} className="min-w-0 scroll-mt-6">
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

        <aside className="lg:sticky lg:top-6">
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
