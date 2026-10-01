"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hint } from "@/components/common/hint";
import { LessonCards } from "@/components/teach/lesson-cards";
import { ModeTabs, ModeTabsList } from "@/components/teach/mode-tabs";
import { useTeach } from "@/components/teach/teach-provider";
import { useTeachMode } from "@/lib/teach/mode";
import type { TeachMode } from "@/lib/teach/types";

export function LessonPicker({
  open,
  onOpenChange,
  only,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  only?: TeachMode;
}) {
  const t = useTranslations("teach");
  const { start } = useTeach();
  const chosenMode = useTeachMode();
  const mode = only ?? chosenMode;
  const chosen = useRef<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-dialog-tall overflow-y-auto sm:max-w-3xl"
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
        {!only && (
          <ModeTabs>
            <ModeTabsList />
          </ModeTabs>
        )}
        <LessonCards
          mode={mode}
          onPick={(lessonId) => {
            chosen.current = lessonId;
            onOpenChange(false);
          }}
        />
        <Hint>{t(`sandbox.${mode}`)}</Hint>
      </DialogContent>
    </Dialog>
  );
}
