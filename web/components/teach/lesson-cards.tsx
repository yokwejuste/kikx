"use client";

import {
  ArrowLeftRight,
  CircleArrowUp,
  CircleCheck,
  Cloud,
  FileInput,
  LayoutTemplate,
  ScrollText,
  ShieldCheck,
  Ship,
  Sparkles,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/common/icon-tile";
import { Hint } from "@/components/common/hint";
import { SectionLabel } from "@/components/common/section-label";
import { lessonMinutes, lessonsFor } from "@/lib/teach/lessons";
import { useCompletedLessons } from "@/lib/teach/use-completed";
import type { LessonIcon, LessonLevel, TeachMode } from "@/lib/teach/types";

const LESSON_ICONS: Record<LessonIcon, LucideIcon> = {
  sparkles: Sparkles,
  template: LayoutTemplate,
  playbook: ScrollText,
  checks: ShieldCheck,
  kubernetes: Ship,
  cloud: Cloud,
  import: FileInput,
  terminal: SquareTerminal,
  sync: ArrowLeftRight,
  upgrade: CircleArrowUp,
};

const LEVELS: LessonLevel[] = ["basics", "further"];

export function LessonCards({
  mode,
  compact = false,
  levels = LEVELS,
  onPick,
}: {
  mode: TeachMode;
  compact?: boolean;
  levels?: LessonLevel[];
  onPick: (lessonId: string) => void;
}) {
  const t = useTranslations("teach");
  const completed = useCompletedLessons();

  return levels.map((level) => {
    const lessons = lessonsFor(mode).filter((lesson) => lesson.level === level);
    if (lessons.length === 0) return null;
    return (
      <section key={level} className="flex flex-col gap-2 text-left">
        <SectionLabel as="h3">{t(`levels.${level}`)}</SectionLabel>
        <ul className="grid gap-2 sm:grid-cols-2">
          {lessons.map((lesson) => {
            const outcomes = compact ? [] : (t.raw(`lessons.${lesson.id}.outcomes`) as string[]);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onPick(lesson.id)}
                  className="flex h-full w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:border-brand/40 hover:bg-muted/40"
                >
                  <span className="flex items-start gap-3">
                    <IconTile icon={LESSON_ICONS[lesson.icon]} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-1.5 font-medium">
                        {t(`lessons.${lesson.id}.title`)}
                        {completed.includes(lesson.id) && (
                          <Badge variant="brand" className="gap-1 font-normal">
                            <CircleCheck className="size-3" />
                            {t("completed")}
                          </Badge>
                        )}
                      </span>
                      <span className="text-muted-foreground">{t(`lessons.${lesson.id}.description`)}</span>
                    </span>
                    <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
                      {t("minutes", { count: lessonMinutes(lesson) })}
                    </Badge>
                  </span>
                  {outcomes.length > 0 && (
                    <span className="flex flex-col gap-1 pl-11">
                      <Hint as="span" className="font-medium">
                        {t("youLearn")}
                      </Hint>
                      {outcomes.map((outcome) => (
                        <Hint as="span" key={outcome} className="flex gap-1.5">
                          <span aria-hidden>·</span>
                          {outcome}
                        </Hint>
                      ))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  });
}
