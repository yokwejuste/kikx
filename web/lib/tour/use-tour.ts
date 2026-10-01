"use client";

import { useCallback, useEffect } from "react";
import { driver, type Config, type DriveStep, type Driver, type PopoverDOM, type Side } from "driver.js";
import { useTranslations } from "next-intl";
import { TOURS, tourTarget, type TourName } from "@/lib/tour/steps";
import { glowAround, stopGlow } from "@/lib/tour/glow";
import { prefersReducedMotion } from "@/lib/dom/motion";
import { readNumber, readToken, TOKENS } from "@/lib/theme/tokens";

const SEEN_PREFIX = "kikx.tour.seen.";
const WAIT_FOR_TARGETS_MS = 2000;

function look(): Config {
  const stagePadding = readNumber(TOKENS.tourStagePadding);
  return {
    popoverClass: "kikx-tour",
    overlayOpacity: readNumber(TOKENS.tourOverlayOpacity),
    stagePadding,
    stageRadius: readNumber(TOKENS.tourStageRadius),
    smoothScroll: true,
    animate: false,
    onHighlighted: (element?: Element) => glowAround(element, stagePadding),
    onPopoverRender: (popover: PopoverDOM) => {
      if (prefersReducedMotion()) return;
      popover.wrapper.animate(
        [
          { opacity: 0, transform: `translateY(${readToken(TOKENS.cardEnterOffset)})` },
          { opacity: 1, transform: "none" },
        ],
        { duration: readNumber(TOKENS.cardEnterDuration), easing: readToken(TOKENS.glideEase) },
      );
    },
  };
}

function popoverRoom(): number {
  return readNumber(TOKENS.tourCardWidth) + readNumber(TOKENS.tourStagePadding) + readNumber(TOKENS.tourCardGap);
}

let activeTour: Driver | null = null;
let blocked = false;

export function blockTours(block: boolean): void {
  blocked = block;
  if (block) activeTour?.destroy();
}

export function closeTour(): void {
  activeTour?.destroy();
}

function launch(config: Config = {}): Driver | null {
  if (blocked) return null;
  activeTour?.destroy();
  const tour = driver({
    ...look(),
    ...config,
    onDestroyed: () => {
      stopGlow();
      if (activeTour === tour) activeTour = null;
    },
  });
  activeTour = tour;
  return tour;
}

function hasSeen(name: TourName) {
  try {
    return window.localStorage.getItem(SEEN_PREFIX + name) === "1";
  } catch {
    return true;
  }
}

function markSeen(name: TourName) {
  try {
    window.localStorage.setItem(SEEN_PREFIX + name, "1");
  } catch {}
}

export function markToursSeen() {
  for (const name of Object.keys(TOURS) as TourName[]) markSeen(name);
}

type Translate = ReturnType<typeof useTranslations<"tour">>;

function visibleTarget(target: string): Element | undefined {
  return Array.from(document.querySelectorAll(tourTarget(target))).find((element) => element.getClientRects().length > 0);
}

function roomiestSide(element: Element): Side {
  const rect = element.getBoundingClientRect();
  const room = popoverRoom();
  if (window.innerWidth - rect.right >= room) return "right";
  if (rect.left >= room) return "left";
  return rect.top > window.innerHeight - rect.bottom ? "top" : "bottom";
}

function presentSteps(name: TourName, t: Translate): DriveStep[] {
  const steps = TOURS[name]
    .map((target) => ({ target, element: visibleTarget(target) }))
    .filter((step): step is { target: string; element: Element } => step.element !== undefined)
    .map(({ target, element }) => ({
      element: () => visibleTarget(target) ?? document.body,
      popover: {
        title: t(`${name}.${target}.title`),
        description: t(`${name}.${target}.description`),
        side: roomiestSide(element),
        align: "start" as const,
      },
    }));
  return steps.map((step, index) =>
    index === 0 ? { ...step, popover: { ...step.popover, showButtons: ["next" as const, "close" as const] } } : step,
  );
}

export function startTour(name: TourName, t: Translate): Driver | null {
  const steps = presentSteps(name, t);
  if (steps.length === 0) return null;
  markSeen(name);
  const tour = launch({
    steps,
    showProgress: steps.length > 1,
    progressText: t("progress", { current: "{{current}}", total: "{{total}}" }),
    nextBtnText: t("next"),
    prevBtnText: t("back"),
    doneBtnText: t("done"),
  });
  tour?.drive();
  return tour;
}

export function useFirstVisitTour(name: TourName, ready = true) {
  const t = useTranslations("tour");
  useEffect(() => {
    if (!ready || hasSeen(name)) return;
    const total = TOURS[name].length;
    const started = performance.now();
    let frame = 0;
    let tour: Driver | null = null;
    const tick = () => {
      const allPresent = presentSteps(name, t).length === total;
      if (allPresent || performance.now() - started > WAIT_FOR_TARGETS_MS) {
        if (!hasSeen(name)) tour = startTour(name, t);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      if (tour?.isActive()) tour.destroy();
    };
  }, [name, ready, t]);
}

export function usePointAt(name: TourName) {
  const t = useTranslations("tour");
  return useCallback(
    (target: string) => {
      const element = visibleTarget(target);
      if (!element) return;
      launch()?.highlight({
        element,
        popover: {
          title: t(`${name}.${target}.title`),
          description: t(`${name}.${target}.description`),
          side: roomiestSide(element),
          align: "start",
          showButtons: ["close"],
        },
      });
    },
    [name, t],
  );
}

export function useStartTour(name: TourName | undefined) {
  const t = useTranslations("tour");
  return useCallback(() => {
    if (name) startTour(name, t);
  }, [name, t]);
}
