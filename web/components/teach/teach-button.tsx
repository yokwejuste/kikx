"use client";

import { useRef, useState } from "react";
import { GraduationCap, LayoutTemplate, Sparkles, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeach } from "@/components/teach/teach-provider";
import { LESSONS, lessonMinutes } from "@/lib/teach/lessons";

const LESSON_ICONS: Record<string, LucideIcon> = {
  firstProject: Sparkles,
  template: LayoutTemplate,
};

export function TeachButton() {
  const t = useTranslations("teach");
  const { start, active } = useTeach();
  const [open, setOpen] = useState(false);
  const chosen = useRef<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
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
        className="sm:max-w-md"
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
        <ul className="flex flex-col gap-2">
          {LESSONS.map((lesson) => {
            const Icon = LESSON_ICONS[lesson.id] ?? GraduationCap;
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => {
                    chosen.current = lesson.id;
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-brand/40 hover:bg-muted/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-volt-soft text-volt-soft-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 font-medium">
                      {t(`lessons.${lesson.id}.title`)}
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {t("minutes", { count: lessonMinutes(lesson) })}
                      </Badge>
                    </span>
                    <span className="text-muted-foreground">{t(`lessons.${lesson.id}.description`)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t("sandbox")}</p>
      </DialogContent>
    </Dialog>
  );
}
