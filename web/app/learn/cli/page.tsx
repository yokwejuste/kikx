"use client";

import { SquareTerminal } from "lucide-react";
import { useTranslations } from "next-intl";
import { RegistryGate } from "@/components/layout/registry-gate";
import { IconTile } from "@/components/common/icon-tile";
import { LessonTerminal } from "@/components/teach/cli/lesson-terminal";
import { ProjectFiles } from "@/components/teach/cli/project-files";

export default function LearnCliPage() {
  return (
    <RegistryGate>
      <LearnCli />
    </RegistryGate>
  );
}

function LearnCli() {
  const t = useTranslations("learnCli");
  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:h-[calc(100dvh-3.5rem)] lg:flex-none">
      <div className="flex items-start gap-3">
        <IconTile icon={SquareTerminal} />
        <span className="flex min-w-0 flex-col">
          <h1 className="text-sm font-medium">{t("title")}</h1>
          <span className="text-sm text-muted-foreground">{t("body")}</span>
        </span>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <LessonTerminal />
        <ProjectFiles />
      </div>
    </main>
  );
}
