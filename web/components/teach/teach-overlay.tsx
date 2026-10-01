"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Gauge, GraduationCap, MousePointer2, Pause, Play, SkipForward, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LESSON_SPEEDS } from "@/lib/teach/speed";
import { CURSOR_MOVE_MS, type LessonView } from "@/lib/teach/player";
import { cn } from "@/lib/utils";

const RING_PADDING = 6;

function useFollowTarget(target: HTMLElement | null) {
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const element = targetRef.current;
      if (element?.isConnected && cursor.current && ring.current) {
        const rect = element.getBoundingClientRect();
        cursor.current.style.transform = `translate(${rect.left + rect.width / 2}px, ${rect.top + rect.height / 2}px)`;
        cursor.current.style.opacity = "1";
        ring.current.style.transform = `translate(${rect.left - RING_PADDING}px, ${rect.top - RING_PADDING}px)`;
        ring.current.style.width = `${rect.width + RING_PADDING * 2}px`;
        ring.current.style.height = `${rect.height + RING_PADDING * 2}px`;
        ring.current.style.opacity = "1";
      } else if (ring.current) {
        ring.current.style.opacity = "0";
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { cursor, ring };
}

export function TeachOverlay({
  title,
  view,
  keepable,
  onPause,
  onResume,
  onNext,
  onSpeed,
  onFinish,
}: {
  title: string;
  view: LessonView;
  keepable: boolean;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onSpeed: (speed: number) => void;
  onFinish: (keep: boolean) => void;
}) {
  const t = useTranslations("teach");
  const format = useFormatter();
  const { cursor, ring } = useFollowTarget(view.target);
  const playing = view.status === "playing";
  const done = view.status === "done";
  const notice = view.status === "lost" ? t("lost") : view.status === "paused" ? t("paused") : null;

  return createPortal(
    <>
      {playing && <div aria-hidden className="pointer-events-auto fixed inset-0 z-[100] cursor-progress" />}

      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[101] rounded-xl border-2 border-volt opacity-0 shadow-[0_0_0_4px_color-mix(in_oklab,var(--volt)_25%,transparent)] transition-opacity duration-300"
      />

      {!done && (
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
        className="pointer-events-auto fixed bottom-4 left-1/2 z-[103] flex w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-3 rounded-xl border bg-card p-4 text-sm shadow-xl"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-volt-soft text-volt-soft-foreground">
            <GraduationCap className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{done ? t("doneTitle") : title}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {t("progress", { step: view.step, total: view.total })}
          </span>
        </div>

        <p aria-live="polite" className="leading-relaxed">
          {view.caption}
        </p>
        {notice && <p className="text-xs text-muted-foreground">{notice}</p>}

        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-volt transition-[width] duration-500"
            style={{ width: `${(view.step / view.total) * 100}%` }}
          />
        </div>

        {done ? (
          <div className="flex flex-wrap justify-end gap-2">
            {keepable && (
              <Button type="button" variant="ghost" onClick={() => onFinish(true)}>
                {t("keep")}
              </Button>
            )}
            <Button type="button" onClick={() => onFinish(false)}>
              {t("back")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {playing ? (
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
            <Button type="button" variant="ghost" size="sm" disabled={!playing} onClick={onNext}>
              <SkipForward />
              {t("next")}
            </Button>
            {playing && <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">{t("takeOver")}</span>}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t("speed")}
                  title={t("speed")}
                  className="ml-auto text-muted-foreground tabular-nums"
                >
                  <Gauge />
                  {t("speedValue", { speed: format.number(view.speed) })}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-teach-ui align="end" side="top" className="z-[104] w-28 min-w-0">
                {LESSON_SPEEDS.map((speed) => (
                  <DropdownMenuItem key={speed} onSelect={() => onSpeed(speed)} className="tabular-nums">
                    {t("speedValue", { speed: format.number(speed) })}
                    {speed === view.speed && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
