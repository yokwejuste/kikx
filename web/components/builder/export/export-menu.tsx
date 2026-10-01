"use client";

import { useState } from "react";
import { ChevronDown, Download, FileArchive, FileJson, Terminal, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CliCommandsDialog } from "@/components/builder/export/cli-commands-dialog";
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";
import { downloadProjectZip } from "@/lib/project/archive";
import { downloadPreset } from "@/lib/project/preset";
import { updateGettingStarted } from "@/lib/project/getting-started-store";

function ExportOption({
  icon: Icon,
  title,
  description,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="items-start gap-2.5 py-2">
      <Icon className="mt-0.5 text-muted-foreground" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </DropdownMenuItem>
  );
}

export function ExportMenu({ details, components }: { details: ProjectDetails; components: AddedComponent[] }) {
  const t = useTranslations("export");
  const [zipping, setZipping] = useState(false);
  const [cliOpen, setCliOpen] = useState(false);
  const empty = components.length === 0;
  const markDownloaded = () => updateGettingStarted(details.name, { downloaded: true });

  const downloadZip = async () => {
    setZipping(true);
    try {
      await downloadProjectZip(details, components);
      markDownloaded();
    } finally {
      setZipping(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <span title={empty ? t("empty") : undefined} className="inline-flex">
          <DropdownMenuTrigger asChild>
            <Button data-tour="download" type="button" disabled={empty || zipping}>
              <Download />
              {zipping ? t("zipping") : t("trigger")}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
        </span>
        <DropdownMenuContent align="end" className="w-72">
          <ExportOption icon={FileArchive} title={t("zip.title")} description={t("zip.description")} onSelect={downloadZip} />
          <ExportOption
            icon={FileJson}
            title={t("preset.title")}
            description={t("preset.description")}
            onSelect={() => {
              downloadPreset(details, components);
              markDownloaded();
            }}
          />
          <ExportOption
            icon={Terminal}
            title={t("cli.option")}
            description={t("cli.description")}
            onSelect={() => setCliOpen(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <CliCommandsDialog open={cliOpen} onOpenChange={setCliOpen} details={details} components={components} />
    </>
  );
}
