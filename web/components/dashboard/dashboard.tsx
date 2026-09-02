"use client";

import { useState } from "react";
import { useProject } from "@/lib/project-context";
import { TopBar } from "@/components/dashboard/top-bar";
import { ComponentTabs } from "@/components/dashboard/component-tabs";
import { CustomComponentPanel } from "@/components/dashboard/custom-component-panel";
import { ProjectFilesList } from "@/components/dashboard/project-files-list";
import { ProjectDiagram } from "@/components/dashboard/project-diagram";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type View = "build" | "diagram";

export function Dashboard() {
  const { details } = useProject();
  const [view, setView] = useState<View>("build");
  if (!details) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
      <TopBar details={details} />

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList>
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="diagram">Architecture</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "diagram" && <ProjectDiagram />}

      <div
        className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start"
        hidden={view !== "build"}
      >
        <div className="flex flex-col gap-6">
          <ComponentTabs />
          <CustomComponentPanel />
        </div>
        <div className="lg:sticky lg:top-8">
          <ProjectFilesList />
        </div>
      </div>
    </div>
  );
}
