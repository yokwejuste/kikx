"use client";

import { useState } from "react";
import Link from "next/link";
import { House, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportMenu } from "@/components/builder/export/export-menu";
import { SEVERITY, type IssueCounts } from "@/components/builder/project/severity";
import { ProjectSettingsDialog, type ProjectSetting } from "@/components/builder/project/project-settings-dialog";
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";
import { loadDownloadRecord, type DownloadRecord } from "@/lib/project/downloads";
import { updateGettingStarted } from "@/lib/project/getting-started-store";
import { StorageStatus } from "@/components/builder/project/storage-status";
import { cn } from "@/lib/utils";

export type View = "build" | "diagram" | "checks";

function ChecksBadge({ counts }: { counts: IssueCounts }) {
  const attention = counts.error + counts.warning;
  if (attention > 0) {
    const { icon: Icon, className } = SEVERITY[counts.error > 0 ? "error" : "warning"];
    return (
      <span className={cn("flex items-center gap-0.5", className)}>
        <Icon className="size-3.5" />
        <span className="tabular-nums">{attention}</span>
      </span>
    );
  }
  if (counts.info > 0) {
    const { icon: Icon, className } = SEVERITY.info;
    return <Icon className={cn("size-3.5", className)} />;
  }
  return null;
}

export function DashboardHeader({
  details,
  components,
  view,
  onViewChange,
  issueCounts,
}: {
  details: ProjectDetails;
  components: AddedComponent[];
  view: View;
  onViewChange: (view: View) => void;
  issueCounts: IssueCounts;
}) {
  const t = useTranslations("builder.header");
  const [lastDownload, setLastDownload] = useState(loadDownloadRecord);
  const [editing, setEditing] = useState<ProjectSetting | null>(null);
  const downloaded = (record: DownloadRecord) => {
    setLastDownload(record);
    updateGettingStarted(details.name, { downloaded: true });
  };

  return (
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="truncate text-lg font-semibold tracking-tight">{details.name}</h1>
        <div className="flex min-w-0 items-center gap-1.5">
          {(
            [
              ["namespace", t("editNamespace", { value: details.namespace }), `ns: ${details.namespace}`],
              ["dir", t("editOutputDir", { value: details.outputDir }), `${details.outputDir}/`],
            ] as const
          ).map(([setting, label, value]) => (
            <Badge key={setting} asChild variant="brand" className="font-mono text-xs font-normal">
              <button
                type="button"
                aria-label={label}
                title={label}
                className="max-w-56 cursor-pointer hover:bg-volt-soft/80 pointer-coarse:h-8 pointer-coarse:px-3"
                onClick={() => setEditing(setting)}
              >
                <span className="truncate">{value}</span>
                <Pencil data-icon="inline-end" className="opacity-60" />
              </button>
            </Badge>
          ))}
        </div>
        <StorageStatus details={details} components={components} lastDownload={lastDownload} />
        <ProjectSettingsDialog details={details} focus={editing} onClose={() => setEditing(null)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs data-tour="views" value={view} onValueChange={(v) => onViewChange(v as View)}>
          <TabsList>
            <TabsTrigger value="build">{t("tabs.build")}</TabsTrigger>
            <TabsTrigger value="diagram">{t("tabs.diagram")}</TabsTrigger>
            <TabsTrigger value="checks" className="gap-1.5">
              {t("tabs.checks")}
              <ChecksBadge counts={issueCounts} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ExportMenu details={details} components={components} onDownloaded={downloaded} />
        <Link
          href="/"
          title={t("homeHint")}
          className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-10"
        >
          <House className="size-4" />
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
