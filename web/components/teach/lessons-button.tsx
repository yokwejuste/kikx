"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LessonPicker } from "@/components/teach/lesson-picker";
import { useTeach } from "@/components/teach/teach-provider";
import { saveMode } from "@/lib/teach/mode";
import type { TeachMode } from "@/lib/teach/types";
import { REPLAY_PARAM } from "@/lib/teach/cli/replay";

const LESSON_PARAM = "teach";
const ARRIVAL_PARAMS = [LESSON_PARAM, REPLAY_PARAM];

export function LessonsButton({ mode, openOnArrival = false }: { mode: TeachMode; openOnArrival?: boolean }) {
  const t = useTranslations("teach");
  const { active } = useTeach();
  const [open, setOpen] = useState(false);
  const teaching = useRef(active);

  useEffect(() => {
    teaching.current = active;
  }, [active]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!openOnArrival || teaching.current || ARRIVAL_PARAMS.some((param) => params.has(param))) return;
    saveMode(mode);
    const frame = requestAnimationFrame(() => {
      if (!teaching.current) setOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, openOnArrival]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={active}
        onClick={() => {
          saveMode(mode);
          setOpen(true);
        }}
      >
        <GraduationCap />
        {t("chooseLesson")}
      </Button>
      <LessonPicker open={open && !active} onOpenChange={setOpen} only={mode} />
    </>
  );
}
