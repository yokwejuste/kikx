"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LessonPicker } from "@/components/teach/lesson-picker";
import { useTeach } from "@/components/teach/teach-provider";

export function TeachButton() {
  const t = useTranslations("teach");
  const { active } = useTeach();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={active}
        className="hidden gap-1.5 text-muted-foreground hover:text-foreground lg:inline-flex"
        onClick={() => setOpen(true)}
      >
        <GraduationCap className="size-4" />
        {t("button")}
      </Button>
      <LessonPicker open={open} onOpenChange={setOpen} />
    </>
  );
}
