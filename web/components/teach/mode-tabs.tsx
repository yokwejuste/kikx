"use client";

import { AppWindow, SquareTerminal, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveMode, useTeachMode } from "@/lib/teach/mode";
import { TEACH_MODES, type TeachMode } from "@/lib/teach/types";

const MODE_ICONS: Record<TeachMode, LucideIcon> = { app: AppWindow, cli: SquareTerminal };

export function ModeTabs({ className, children }: { className?: string; children?: React.ReactNode }) {
  const mode = useTeachMode();
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => saveMode(TEACH_MODES.find((candidate) => candidate === value) ?? mode)}
      className={className}
    >
      {children}
    </Tabs>
  );
}

export function ModeTabsList(props: Omit<React.ComponentProps<typeof TabsList>, "children">) {
  const t = useTranslations("home.mode");
  return (
    <TabsList variant="pill" {...props}>
      <ModeTrigger mode="app" label={t("app")} />
      <ModeTrigger mode="cli" label={t("cli")} />
    </TabsList>
  );
}

function ModeTrigger({ mode, label }: { mode: TeachMode; label: string }) {
  const Icon = MODE_ICONS[mode];
  return (
    <TabsTrigger value={mode} data-teach={`mode-${mode}`}>
      <Icon />
      {label}
    </TabsTrigger>
  );
}
