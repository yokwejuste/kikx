"use client";

import { useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeach } from "@/components/teach/teach-provider";
import { LessonCards } from "@/components/teach/lesson-cards";
import { ModeTabs, ModeTabsList } from "@/components/teach/mode-tabs";
import { useTeachMode } from "@/lib/teach/mode";
import { Hint } from "@/components/common/hint";

export function TeachButton() {
  const t = useTranslations("teach");
  const { start, active } = useTeach();
  const mode = useTeachMode();
  const [open, setOpen] = useState(false);
  const chosen = useRef<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogDescription>{t(`body.${mode}`)}</DialogDescription>
        </DialogHeader>
        <ModeTabs>
          <ModeTabsList />
        </ModeTabs>
        <LessonCards
          mode={mode}
          onPick={(lessonId) => {
            chosen.current = lessonId;
            setOpen(false);
          }}
        />
        <Hint>{t(`sandbox.${mode}`)}</Hint>
      </DialogContent>
    </Dialog>
  );
}
