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
import { recordDownload, type DownloadRecord } from "@/lib/project/downloads";
import { Hint } from "@/components/common/hint";

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
        <Hint as="span">{description}</Hint>
      </span>
    </DropdownMenuItem>
  );
}

export function ExportMenu({
  details,
  components,
  onDownloaded,
}: {
  details: ProjectDetails;
  components: AddedComponent[];
  onDownloaded: (record: DownloadRecord) => void;
}) {
  const t = useTranslations("export");
  const [zipping, setZipping] = useState(false);
  const [cliOpen, setCliOpen] = useState(false);
  const empty = components.length === 0;

  const downloadZip = async () => {
    setZipping(true);
    try {
      await downloadProjectZip(details, components);
      onDownloaded(recordDownload(details, components));
    } finally {
      setZipping(false);
    }
  };

  const downloadPresetFile = () => {
    downloadPreset(details, components);
    onDownloaded(recordDownload(details, components));
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <span title={empty ? t("empty") : undefined} className="inline-flex">
          <DropdownMenuTrigger asChild>
            <Button data-tour="download" disabled={empty || zipping}>
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
            onSelect={downloadPresetFile}
          />
          <ExportOption
            icon={Terminal}
            title={t("cli.option")}
            description={t("cli.description")}
            onSelect={() => setCliOpen(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <CliCommandsDialog open={cliOpen} onOpenChange={setCliOpen} details={details} onDownloadPreset={downloadPresetFile} />
    </>
  );
}
