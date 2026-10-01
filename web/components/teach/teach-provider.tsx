"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TeachOverlay } from "@/components/teach/teach-overlay";
import { useProject } from "@/lib/project/context";
import { projectDefaults } from "@/lib/registry/store";
import { LESSONS } from "@/lib/teach/lessons";
import { LessonPlayer, type LessonView } from "@/lib/teach/player";
import { beginSandbox, endSandbox, hasPendingSandbox } from "@/lib/teach/sandbox";
import { prefersReducedMotion } from "@/lib/teach/dom";
import { loadSpeed, saveSpeed } from "@/lib/teach/speed";

interface TeachContextValue {
  start: (lessonId: string) => void;
  active: boolean;
}

const TEACH_PARAM = "teach";

const TeachContext = createContext<TeachContextValue | null>(null);

export function useTeach(): TeachContextValue {
  const context = useContext(TeachContext);
  if (!context) throw new Error("useTeach must be used inside TeachProvider");
  return context;
}

export function TeachProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("teach");
  const router = useRouter();
  const { reset } = useProject();
  const player = useRef<LessonPlayer | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [view, setView] = useState<LessonView | null>(null);
  const [keepable, setKeepable] = useState(false);

  const finish = useCallback((keep: boolean) => {
    player.current?.stop();
    player.current = null;
    const returnPath = endSandbox(keep);
    if (keep) {
      setLessonId(null);
      setView(null);
      return;
    }
    window.location.assign(returnPath);
  }, []);

  const start = useCallback(
    (id: string) => {
      const lesson = LESSONS.find((candidate) => candidate.id === id);
      if (!lesson || player.current) return;
      const sandbox = beginSandbox(window.location.pathname);
      if (!sandbox) return;
      setKeepable(!sandbox.hadProject);
      reset();
      const lessonPlayer = new LessonPlayer(lesson, {
        say: (key) => t(`lessons.${id}.steps.${key}`),
        value: (value) => (value === "projectName" ? projectDefaults().defaultProjectName : t(`demo.${value}`)),
        navigate: (path) => router.push(path),
        reducedMotion: prefersReducedMotion(),
        speed: loadSpeed(),
        onChange: setView,
      });
      player.current = lessonPlayer;
      setLessonId(id);
      void lessonPlayer.play();
    },
    [reset, router, t],
  );

  const startRef = useRef(start);
  const booted = useRef(false);

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (hasPendingSandbox()) {
      endSandbox(false);
      window.location.reload();
      return;
    }
    const url = new URL(window.location.href);
    const requested = url.searchParams.get(TEACH_PARAM);
    if (!requested) return;
    url.searchParams.delete(TEACH_PARAM);
    window.history.replaceState(window.history.state, "", url);
    startRef.current(requested);
  }, []);

  const playing = view?.status === "playing";

  useEffect(() => {
    if (!playing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const insideControls = event.target instanceof Element && event.target.closest("[data-teach-ui]");
      if (event.isTrusted && event.key === "Escape" && !insideControls) {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [playing, finish]);

  const value = useMemo(() => ({ start, active: lessonId !== null }), [start, lessonId]);

  return (
    <TeachContext.Provider value={value}>
      {children}
      {lessonId && view && (
        <TeachOverlay
          title={t(`lessons.${lessonId}.title`)}
          view={view}
          keepable={keepable}
          onPause={() => player.current?.pause()}
          onResume={() => player.current?.resume()}
          onNext={() => player.current?.next()}
          onSpeed={(speed) => {
            saveSpeed(speed);
            player.current?.setSpeed(speed);
          }}
          onFinish={finish}
        />
      )}
    </TeachContext.Provider>
  );
}
