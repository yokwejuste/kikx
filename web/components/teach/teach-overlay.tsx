"use client";

import { useEffect, useRef, useState } from "react";
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
import { IconButton } from "@/components/common/icon-button";
import { DoneMark } from "@/components/common/done-mark";
import { IconTile } from "@/components/common/icon-tile";
import { ProgressBar } from "@/components/common/progress-bar";
import { CURSOR_MOVE_MS, type LessonView } from "@/lib/teach/player";
import { LESSON_SPEEDS } from "@/lib/teach/speed";
import { frameRect, glide, trackRect } from "@/lib/dom/track-rect";
import { cssVar, readNumber, TOKENS } from "@/lib/theme/tokens";
import { highlightRect } from "@/lib/teach/dom";
import { siteHeaderBottom } from "@/lib/layout/site-header";
import { placeCard, type CardSide } from "@/lib/teach/placement";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";
import { Spinner } from "@/components/common/spinner";

const WORD_MS = 1100;

const stopOutsideDismiss = (event: React.PointerEvent) => event.stopPropagation();

function useFollowTarget(target: HTMLElement | null) {
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const side = useRef<CardSide | null>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    if (ring.current && targetRef.current && target && target !== targetRef.current) glide(ring.current);
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const padding = readNumber(TOKENS.teachRingPadding);
    const margin = readNumber(TOKENS.teachCardMargin);
    const room = {
      gap: readNumber(TOKENS.teachCardGap),
      margin,
      header: siteHeaderBottom() + margin,
      arrowInset: readNumber(TOKENS.teachArrowInset),
    };
    return trackRect(
      () => highlightRect(targetRef.current),
      (rect) => {
        if (!ring.current) return;
        ring.current.style.opacity = rect ? "1" : "0";
        if (rect) frameRect(ring.current, rect, padding);
        if (bar.current && arrow.current) {
          const box = rect && {
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          };
          const viewport = { width: window.innerWidth, height: window.innerHeight };
          const card = { width: bar.current.offsetWidth, height: bar.current.offsetHeight };
          const placement = placeCard(box, card, viewport, side.current, room);
          side.current = placement.side;
          bar.current.style.transform = `translate(${placement.left}px, ${placement.top}px)`;
          bar.current.style.opacity = "1";
          pointArrow(arrow.current, placement.side, placement.arrow);
        }
        if (!rect) return;
        const point = targetRef.current?.getBoundingClientRect() ?? rect;
        if (cursor.current) {
          cursor.current.style.transform = `translate(${point.left + point.width / 2}px, ${point.top + point.height / 2}px)`;
          cursor.current.style.opacity = "1";
        }
      },
    );
  }, []);

  return { cursor, ring, bar, arrow };
}

function pointArrow(arrow: HTMLSpanElement, side: CardSide | null, offset: number) {
  arrow.style.display = side ? "block" : "none";
  if (!side) return;
  arrow.dataset.side = side;
  arrow.style.setProperty("--arrow-offset", `${offset}px`);
}

function WaitingWords() {
  const t = useTranslations("teach");
  const words = t.raw("waiting") as string[];
  const [index, setIndex] = useState(() => Math.floor(Math.random() * words.length));

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % words.length), WORD_MS);
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <p aria-live="polite" className="flex items-center gap-2 text-muted-foreground">
      <Spinner className="shrink-0 motion-reduce:animate-none" />
      {t("waitingWord", { word: words[index] })}
    </p>
  );
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
  const { cursor, ring, bar, arrow } = useFollowTarget(view.target);
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
          className="pointer-events-auto fixed inset-0 z-teach-shield cursor-progress"
        />
      )}

      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-teach-ring rounded-xl border-2 border-volt opacity-0 shadow-halo transition-opacity duration-300"
      />

      {!done && !practising && (
        <div
          ref={cursor}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-teach-pointer opacity-0 motion-reduce:transition-none"
          style={{
            transform: cssVar(TOKENS.teachPointerStart),
            transitionProperty: "transform, opacity",
            transitionDuration: `${CURSOR_MOVE_MS / view.speed}ms`,
            transitionTimingFunction: cssVar(TOKENS.glideEase),
          }}
        >
          <span
            key={`ripple-${view.clicks}`}
            className={cn("absolute -top-4 -left-4 size-8 rounded-full bg-volt/40 opacity-0", view.clicks > 0 && "teach-ripple")}
          />
          <span key={`press-${view.clicks}`} className={cn("relative -top-1 -left-1 block origin-top-left", view.clicks > 0 && "teach-press")}>
            <MousePointer2 className="size-7 fill-volt stroke-foreground drop-shadow-md" strokeWidth={1.5} />
          </span>
        </div>
      )}

      <section
        ref={bar}
        data-teach-ui
        aria-label={t("region")}
        onPointerDown={stopOutsideDismiss}
        style={{ opacity: 0 }}
        className="pointer-events-auto fixed top-0 left-0 z-teach-card w-teach-card rounded-xl border border-brand/60 bg-card text-sm shadow-xl transition-[transform,opacity] duration-300 ease-glide motion-reduce:transition-none"
      >
        <span
          ref={arrow}
          aria-hidden
          className="teach-arrow absolute hidden rotate-45 border-brand/60 bg-card"
        />
        <div className="flex max-h-teach-scroll flex-col gap-3 overflow-y-auto p-4">
          <div className="flex items-start gap-2">
            <IconTile icon={practising ? Hand : GraduationCap} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{done ? t("doneTitle") : practising ? t("yourTurn") : title}</span>
              {view.chapter && !done && (
                <Hint as="span" className="truncate">
                  {t("chapter", { index: view.chapter.index, total: view.chapter.total, title: view.chapter.title })}
                </Hint>
              )}
            </span>
            {view.chapter && !done ? (
              <ChapterDots index={view.chapter.index} total={view.chapter.total} />
            ) : (
              <Hint as="span" className="shrink-0 tabular-nums">
                {t("progress", { step: view.step, total: view.total })}
              </Hint>
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
          ) : view.waiting ? (
            <WaitingWords />
          ) : (
            <p
              key={view.caption ?? ""}
              aria-live="polite"
              className="leading-relaxed animate-in duration-300 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"
            >
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

          {notice && <Hint>{notice}</Hint>}

          <ProgressBar value={view.step} max={view.total} />

          {done ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {keepable && (
                <Button variant="ghost" onClick={() => onFinish(true)}>
                  {t("keep")}
                </Button>
              )}
              <Button variant={upNext ? "outline" : "default"} onClick={() => onFinish(false)}>
                {t("back")}
              </Button>
              {upNext && (
                <Button onClick={() => onFinish(false, upNext.id)}>
                  {t("nextLesson", { title: upNext.title })}
                  <ArrowRight />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {practising ? (
                <Button size="sm" onClick={onShowMe}>
                  <MousePointer2 />
                  {t("showMe")}
                </Button>
              ) : playing ? (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause />
                  {t("pause")}
                </Button>
              ) : (
                <Button size="sm" onClick={onResume}>
                  <Play />
                  {t("play")}
                </Button>
              )}
              {!practising && (
                <IconButton icon={SkipForward} label={t("next")} size="sm" disabled={!playing} onClick={onNext} />
              )}
              {learnHref && (
                <IconButton asChild label={t("learnMore")} size="sm">
                  <a href={learnHref} target="_blank" rel="noreferrer" onClick={onPause}>
                    <BookOpen />
                  </a>
                </IconButton>
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
              <IconButton icon={X} size="sm" label={t("stop")} onClick={() => onFinish(false)} />
            </div>
          )}
        </div>
      </section>
    </>,
    document.body,
  );
}
