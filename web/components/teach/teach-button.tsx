"use client";

import { useRef, useState } from "react";
import {
  CircleCheck,
  Cloud,
  FileInput,
  GraduationCap,
  LayoutTemplate,
  ScrollText,
  ShieldCheck,
  Ship,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/common/icon-tile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeach } from "@/components/teach/teach-provider";
import { LESSONS, lessonMinutes } from "@/lib/teach/lessons";
import { loadCompleted } from "@/lib/teach/progress";
import type { LessonIcon, LessonLevel } from "@/lib/teach/types";
import { Hint } from "@/components/common/hint";
import { SectionLabel } from "@/components/common/section-label";

const LESSON_ICONS: Record<LessonIcon, LucideIcon> = {
  sparkles: Sparkles,
  template: LayoutTemplate,
  playbook: ScrollText,
  checks: ShieldCheck,
  kubernetes: Ship,
  cloud: Cloud,
  import: FileInput,
};

const LEVELS: LessonLevel[] = ["basics", "further"];

export function TeachButton() {
  const t = useTranslations("teach");
  const { start, active } = useTeach();
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const chosen = useRef<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setCompleted(loadCompleted());
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={active}
          className="hidden gap-1.5 text-muted-foreground hover:text-foreground lg:inline-flex"
        >
          <GraduationCap className="size-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-3xl"
        onCloseAutoFocus={(event) => {
          const lessonId = chosen.current;
          if (!lessonId) return;
          event.preventDefault();
          chosen.current = null;
          start(lessonId);
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        {LEVELS.map((level) => {
          const lessons = LESSONS.filter((lesson) => lesson.level === level);
          if (lessons.length === 0) return null;
          return (
            <section key={level} className="flex flex-col gap-2">
              <SectionLabel as="h3">{t(`levels.${level}`)}</SectionLabel>
              <ul className="grid gap-2 sm:grid-cols-2">
                {lessons.map((lesson) => {
                  const outcomes = t.raw(`lessons.${lesson.id}.outcomes`) as string[];
                  const isDone = completed.includes(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => {
                          chosen.current = lesson.id;
                          setOpen(false);
                        }}
                        className="flex h-full w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:border-brand/40 hover:bg-muted/40"
                      >
                        <span className="flex items-start gap-3">
                          <IconTile icon={LESSON_ICONS[lesson.icon]} />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex flex-wrap items-center gap-1.5 font-medium">
                              {t(`lessons.${lesson.id}.title`)}
                              {isDone && (
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
                        <span className="flex flex-col gap-1 pl-11">
                          <Hint as="span" className="font-medium">{t("youLearn")}</Hint>
                          {outcomes.map((outcome) => (
                            <Hint as="span" key={outcome} className="flex gap-1.5">
                              <span aria-hidden>·</span>
                              {outcome}
                            </Hint>
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        <Hint>{t("sandbox")}</Hint>
      </DialogContent>
    </Dialog>
  );
}
