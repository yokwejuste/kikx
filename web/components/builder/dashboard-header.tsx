"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEVERITY, type IssueCounts } from "@/components/builder/project/severity";
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";
import { downloadProjectZip } from "@/lib/project/archive";
import { updateGettingStarted } from "@/lib/project/getting-started-store";
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
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadProjectZip(details, components);
      updateGettingStarted(details.name, { downloaded: true });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-lg font-semibold tracking-tight">{details.name}</h1>
        <div className="hidden items-center gap-1.5 sm:flex">
          <Badge variant="brand" className="font-mono text-xs font-normal" title={t("namespace")}>
            ns: {details.namespace}
          </Badge>
          <Badge variant="brand" className="font-mono text-xs font-normal" title={t("outputDir")}>
            {details.outputDir}/
          </Badge>
        </div>
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
        <Button data-tour="download" type="button" disabled={components.length === 0 || downloading} onClick={download}>
          <Download />
          {downloading ? t("zipping") : t("download")}
        </Button>
        <Link href="/" className="flex items-center px-2 text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-10">
          {t("startOver")}
        </Link>
      </div>
    </div>
  );
}
