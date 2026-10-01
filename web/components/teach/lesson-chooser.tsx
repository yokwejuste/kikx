"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconTile } from "@/components/common/icon-tile";
import { Hint } from "@/components/common/hint";
import { LessonCards } from "@/components/teach/lesson-cards";
import { useTeach } from "@/components/teach/teach-provider";
import type { LessonLevel, TeachMode } from "@/lib/teach/types";

const ALL_LESSONS_PATH: Record<TeachMode, string> = { app: "/learn/app", cli: "/learn/cli" };

export function LessonChooser({
  mode,
  compact = false,
  levels,
  note,
}: {
  mode: TeachMode;
  compact?: boolean;
  levels?: LessonLevel[];
  note?: string;
}) {
  const t = useTranslations("teach.chooser");
  const { start, active } = useTeach();
  if (active) return null;

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl border p-4 text-left">
      <div className="flex items-start gap-3">
        <IconTile icon={GraduationCap} />
        <span className="flex min-w-0 flex-col">
          <h2 className="text-sm font-medium">{t(`${mode}.title`)}</h2>
          <Hint as="span">{t(`${mode}.body`)}</Hint>
        </span>
      </div>
      <LessonCards mode={mode} compact={compact} levels={levels} onPick={start} />
      {(note || levels) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {note && <Hint as="span">{note}</Hint>}
          {levels && (
            <Link
              href={ALL_LESSONS_PATH[mode]}
              className="ml-auto flex items-center gap-1 text-sm text-brand underline-offset-4 hover:underline"
            >
              {t("all")}
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
