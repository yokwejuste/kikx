"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { TeachOverlay } from "@/components/teach/teach-overlay";
import { useProject } from "@/lib/project/context";
import { loadStoredProject } from "@/lib/project/storage";
import { projectDefaults } from "@/lib/registry/store";
import { docsHref } from "@/lib/i18n/docs";
import { LESSONS, nextLesson } from "@/lib/teach/lessons";
import { LessonPlayer, type LessonView } from "@/lib/teach/player";
import { beginSandbox, endSandbox, hasPendingSandbox } from "@/lib/teach/sandbox";
import { prefersReducedMotion } from "@/lib/dom/motion";
import { loadSpeed, saveSpeed } from "@/lib/teach/speed";
import { markCompleted } from "@/lib/teach/progress";
import { blockTours } from "@/lib/tour/use-tour";
import { textOf } from "@/lib/teach/steps";
import { flagWords } from "@/lib/teach/cli/spec";
import { cliSession } from "@/lib/teach/cli/session";
import { loadMode, saveMode } from "@/lib/teach/mode";
import type { TeachMode } from "@/lib/teach/types";

interface TeachContextValue {
  start: (lessonId: string) => void;
  active: boolean;
}

const TEACH_PARAM = "teach";
const HOME_PATH = "/";
const BUILDER_PATH = "/build";

const TeachContext = createContext<TeachContextValue | null>(null);

export function useTeach(): TeachContextValue {
  const context = useContext(TeachContext);
  if (!context) throw new Error("useTeach must be used inside TeachProvider");
  return context;
}

function withLesson(path: string, lessonId: string): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(TEACH_PARAM, lessonId);
  return `${url.pathname}${url.search}`;
}

export function TeachProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("teach");
  const locale = useLocale();
  const router = useRouter();
  const { reset } = useProject();
  const player = useRef<LessonPlayer | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [view, setView] = useState<LessonView | null>(null);
  const [keepable, setKeepable] = useState(false);
  const modeBefore = useRef<TeachMode | null>(null);

  const finish = useCallback((keep: boolean, then?: string) => {
    player.current?.stop();
    player.current = null;
    if (modeBefore.current) saveMode(modeBefore.current);
    const returnPath = endSandbox(keep);
    if (keep && !then) {
      blockTours(false);
      setLessonId(null);
      setView(null);
      return;
    }
    window.location.assign(then ? withLesson(returnPath, then) : loadStoredProject()?.details ? BUILDER_PATH : HOME_PATH);
  }, []);

  const start = useCallback(
    (id: string) => {
      const lesson = LESSONS.find((candidate) => candidate.id === id);
      if (!lesson || player.current) return;
      const sandbox = beginSandbox(window.location.pathname);
      if (!sandbox) return;
      setKeepable(lesson.mode === "app" && !sandbox.hadProject);
      modeBefore.current = loadMode();
      blockTours(true);
      reset();
      cliSession.reset();
      const demoValues = t.has(`lessons.${id}.demo`) ? (t.raw(`lessons.${id}.demo`) as Record<string, string>) : {};
      const values = { ...flagWords(), ...demoValues };
      const lessonPlayer = new LessonPlayer(lesson, {
        say: (key) => t(`lessons.${id}.steps.${key}`, values),
        chapter: (key) => t(`lessons.${id}.chapters.${key}`),
        check: (key) => t(`lessons.${id}.checks.${key}`, values),
        praise: () => t("praise"),
        text: (ref) =>
          textOf(
            ref,
            (key) => t(`lessons.${id}.demo.${key}`),
            () => projectDefaults().defaultProjectName,
          ),
        navigate: (path) => router.push(path),
        reducedMotion: prefersReducedMotion(),
        speed: loadSpeed(),
        onChange: setView,
        onComplete: () => markCompleted(id),
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
  const upNext = lessonId ? nextLesson(lessonId) : null;

  return (
    <TeachContext.Provider value={value}>
      {children}
      {lessonId && view && (
        <TeachOverlay
          title={t(`lessons.${lessonId}.title`)}
          recap={t.raw(`lessons.${lessonId}.recap`) as string[]}
          upNext={upNext ? { id: upNext.id, title: t(`lessons.${upNext.id}.title`) } : null}
          learnHref={view.learn ? docsHref(view.learn, locale) : null}
          view={view}
          keepable={keepable}
          onPause={() => player.current?.pause()}
          onResume={() => player.current?.resume()}
          onNext={() => player.current?.next()}
          onShowMe={() => player.current?.showMe()}
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
