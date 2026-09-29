"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEVERITY, type IssueCounts } from "@/components/builder/project/severity";
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";
import { downloadProjectZip } from "@/lib/project/archive";
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
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadProjectZip(details, components);
    } finally {
      setDownloading(false);
    }
  };

  return (
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
        <Tabs data-tour="views" value={view} onValueChange={(v) => onViewChange(v as View)}>
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="diagram">Architecture</TabsTrigger>
            <TabsTrigger value="checks" className="gap-1.5">
              Checks
              <ChecksBadge counts={issueCounts} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button data-tour="download" type="button" disabled={components.length === 0 || downloading} onClick={download}>
          <Download />
          {downloading ? "Zipping…" : "Download .zip"}
        </Button>
        <Link href="/" className="px-2 text-sm text-muted-foreground hover:text-foreground">
          Start over
        </Link>
      </div>
    </div>
  );
}
