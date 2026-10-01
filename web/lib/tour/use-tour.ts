"use client";

import { useCallback, useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import { useTranslations } from "next-intl";
import { TOURS, tourTarget, type TourName } from "@/lib/tour/steps";
import { glowAround, stopGlow } from "@/lib/tour/glow";

const SEEN_PREFIX = "kikx.tour.seen.";
const WAIT_FOR_TARGETS_MS = 2000;
const STAGE_PADDING = 12;
const STAGE_RADIUS = 16;
const LOOK = {
  popoverClass: "kikx-tour",
  overlayOpacity: 0.55,
  stagePadding: STAGE_PADDING,
  stageRadius: STAGE_RADIUS,
  smoothScroll: true,
  onHighlighted: (element?: Element) => glowAround(element, STAGE_PADDING, STAGE_RADIUS),
  onDestroyed: () => stopGlow(),
};

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

function presentSteps(name: TourName, t: Translate): DriveStep[] {
  const steps = TOURS[name]
    .filter((target) => visibleTarget(target))
    .map((target) => ({
      element: () => visibleTarget(target) ?? document.body,
      popover: { title: t(`${name}.${target}.title`), description: t(`${name}.${target}.description`) },
    }));
  return steps.map((step, index) =>
    index === 0 ? { ...step, popover: { ...step.popover, showButtons: ["next" as const, "close" as const] } } : step,
  );
}

export function startTour(name: TourName, t: Translate) {
  const steps = presentSteps(name, t);
  if (steps.length === 0) return;
  markSeen(name);
  driver({
    ...LOOK,
    steps,
    showProgress: steps.length > 1,
    progressText: t("progress", { current: "{{current}}", total: "{{total}}" }),
    nextBtnText: t("next"),
    prevBtnText: t("back"),
    doneBtnText: t("done"),
  }).drive();
}

export function useFirstVisitTour(name: TourName, ready = true) {
  const t = useTranslations("tour");
  useEffect(() => {
    if (!ready || hasSeen(name)) return;
    const total = TOURS[name].length;
    const started = performance.now();
    let frame = 0;
    const tick = () => {
      const allPresent = presentSteps(name, t).length === total;
      if (allPresent || performance.now() - started > WAIT_FOR_TARGETS_MS) {
        if (!hasSeen(name)) startTour(name, t);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [name, ready, t]);
}

export function usePointAt(name: TourName) {
  const t = useTranslations("tour");
  return useCallback(
    (target: string) => {
      const element = visibleTarget(target);
      if (!element) return;
      driver(LOOK).highlight({
        element,
        popover: {
          title: t(`${name}.${target}.title`),
          description: t(`${name}.${target}.description`),
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
