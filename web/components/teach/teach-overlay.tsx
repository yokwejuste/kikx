"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Gauge,
  GraduationCap,
  Hand,
  MousePointer2,
  Pause,
  Play,
  SkipForward,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DoneMark } from "@/components/common/done-mark";
import { IconTile } from "@/components/common/icon-tile";
import { ProgressBar } from "@/components/common/progress-bar";
import { CURSOR_MOVE_MS, type LessonView } from "@/lib/teach/player";
import { LESSON_SPEEDS } from "@/lib/teach/speed";
import { frameRect, trackRect } from "@/lib/dom/track-rect";
import { cn } from "@/lib/utils";

const RING_PADDING = 6;

const stopOutsideDismiss = (event: React.PointerEvent) => event.stopPropagation();

function useFollowTarget(target: HTMLElement | null) {
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(
    () =>
      trackRect(
        () => targetRef.current,
        (rect) => {
          if (!ring.current) return;
          ring.current.style.opacity = rect ? "1" : "0";
          if (!rect) return;
          frameRect(ring.current, rect, RING_PADDING);
          if (cursor.current) {
            cursor.current.style.transform = `translate(${rect.left + rect.width / 2}px, ${rect.top + rect.height / 2}px)`;
            cursor.current.style.opacity = "1";
          }
        },
      ),
    [],
  );

  return { cursor, ring };
}

function ChapterDots({ index, total }: { index: number; total: number }) {
  return (
    <span aria-hidden className="mt-1.5 flex shrink-0 gap-1">
      {Array.from({ length: total }, (_, position) => (
        <span
          key={position}
          className={cn("size-1.5 rounded-full", position < index ? "bg-volt" : "bg-muted-foreground/30")}
        />
      ))}
    </span>
  );
}

export function TeachOverlay({
  title,
  recap,
  upNext,
  learnHref,
  view,
  keepable,
  onPause,
  onResume,
  onNext,
  onShowMe,
  onSpeed,
  onFinish,
}: {
  title: string;
  recap: string[];
  upNext: { id: string; title: string } | null;
  learnHref: string | null;
  view: LessonView;
  keepable: boolean;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onShowMe: () => void;
  onSpeed: (speed: number) => void;
  onFinish: (keep: boolean, then?: string) => void;
}) {
  const t = useTranslations("teach");
  const format = useFormatter();
  const { cursor, ring } = useFollowTarget(view.target);
  const playing = view.status === "playing";
  const practising = view.status === "task";
  const done = view.status === "done";
  const notice = view.status === "lost" ? t("lost") : view.status === "paused" ? t("paused") : null;

  return createPortal(
    <>
      {playing && (
        <div
          aria-hidden
          onPointerDown={stopOutsideDismiss}
          className="pointer-events-auto fixed inset-0 z-[100] cursor-progress"
        />
      )}

      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[101] rounded-xl border-2 border-volt opacity-0 shadow-[0_0_0_4px_color-mix(in_oklab,var(--volt)_25%,transparent)] transition-opacity duration-300"
      />

      {!done && !practising && (
        <div
          ref={cursor}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-[102] opacity-0 ease-out motion-reduce:transition-none"
          style={{
            transform: "translate(50vw, 60vh)",
            transitionProperty: "transform, opacity",
            transitionDuration: `${CURSOR_MOVE_MS / view.speed}ms`,
          }}
        >
          <span
            key={view.clicks}
            className={cn("absolute -top-4 -left-4 size-8 rounded-full bg-volt/40 opacity-0", view.clicks > 0 && "teach-ripple")}
          />
          <MousePointer2 className="relative -top-1 -left-1 size-7 fill-volt stroke-foreground drop-shadow-md" strokeWidth={1.5} />
        </div>
      )}

      <section
        data-teach-ui
        aria-label={t("region")}
        onPointerDown={stopOutsideDismiss}
        className="pointer-events-auto fixed bottom-4 left-1/2 z-[103] flex max-h-[70vh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-4 text-sm shadow-xl"
      >
        <div className="flex items-start gap-2">
          <IconTile icon={practising ? Hand : GraduationCap} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{done ? t("doneTitle") : practising ? t("yourTurn") : title}</span>
            {view.chapter && !done && (
              <span className="truncate text-xs text-muted-foreground">
                {t("chapter", { index: view.chapter.index, total: view.chapter.total, title: view.chapter.title })}
              </span>
            )}
          </span>
          {view.chapter && !done ? (
            <ChapterDots index={view.chapter.index} total={view.chapter.total} />
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {t("progress", { step: view.step, total: view.total })}
            </span>
          )}
        </div>

        {done ? (
          <div className="flex flex-col gap-2">
            <p className="font-medium">{t("recapTitle")}</p>
            <ul className="flex flex-col gap-1.5">
              {recap.map((line) => (
                <li key={line} className="flex gap-2 text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p aria-live="polite" className="leading-relaxed">
            {view.caption}
          </p>
        )}

        {practising && view.task && (
          <ul className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
            {view.task.map((check) => (
              <li key={check.label} className={cn("flex items-center gap-2", check.done && "text-muted-foreground line-through")}>
                <DoneMark done={check.done} />
                {check.label}
              </li>
            ))}
          </ul>
        )}

        {notice && <p className="text-xs text-muted-foreground">{notice}</p>}

        <ProgressBar value={view.step} max={view.total} />

        {done ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {keepable && (
              <Button type="button" variant="ghost" onClick={() => onFinish(true)}>
                {t("keep")}
              </Button>
            )}
            <Button type="button" variant={upNext ? "outline" : "default"} onClick={() => onFinish(false)}>
              {t("back")}
            </Button>
            {upNext && (
              <Button type="button" onClick={() => onFinish(false, upNext.id)}>
                {t("nextLesson", { title: upNext.title })}
                <ArrowRight />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {practising ? (
              <Button type="button" size="sm" onClick={onShowMe}>
                <MousePointer2 />
                {t("showMe")}
              </Button>
            ) : playing ? (
              <Button type="button" variant="outline" size="sm" onClick={onPause}>
                <Pause />
                {t("pause")}
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={onResume}>
                <Play />
                {t("play")}
              </Button>
            )}
            {!practising && (
              <Button type="button" variant="ghost" size="sm" disabled={!playing} onClick={onNext}>
                <SkipForward />
                {t("next")}
              </Button>
            )}
            {learnHref && (
              <Button asChild variant="ghost" size="sm">
                <a href={learnHref} target="_blank" rel="noreferrer" onClick={onPause}>
                  <BookOpen />
                  {t("learnMore")}
                </a>
              </Button>
            )}
            <label className="ml-auto flex items-center gap-1 text-xs text-muted-foreground" title={t("speed")}>
              <Gauge className="size-3.5" />
              <span className="sr-only">{t("speed")}</span>
              <select
                value={view.speed}
                onChange={(event) => onSpeed(Number(event.target.value))}
                className="rounded-md bg-transparent py-1 tabular-nums hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {LESSON_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {t("speedValue", { speed: format.number(speed) })}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={t("stop")}
              title={t("stop")}
              onClick={() => onFinish(false)}
            >
              <X />
            </Button>
          </div>
        )}
      </section>
    </>,
    document.body,
  );
}
