"use client";

import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconTile } from "@/components/common/icon-tile";
import { Hint } from "@/components/common/hint";
import { LessonsButton } from "@/components/teach/lessons-button";

export default function LearnAppPage() {
  const t = useTranslations("teach.learnPage.app");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <IconTile icon={GraduationCap} size="lg" />
      <h1 className="text-lg font-medium">{t("title")}</h1>
      <Hint className="max-w-md text-sm">{t("body")}</Hint>
      <LessonsButton mode="app" openOnArrival />
    </main>
  );
}
