"use client";

import { useCallback, useEffect } from "react";
import { driver } from "driver.js";
import { TOURS, type TourName } from "@/lib/tour/steps";

const SEEN_PREFIX = "kikx.tour.seen.";
const WAIT_FOR_TARGETS_MS = 2000;

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

function presentSteps(name: TourName) {
  const steps = TOURS[name].filter((step) => typeof step.element !== "string" || document.querySelector(step.element));
  return steps.map((step, index) =>
    index === 0 ? { ...step, popover: { ...step.popover, showButtons: ["next" as const, "close" as const] } } : step,
  );
}

export function startTour(name: TourName) {
  const steps = presentSteps(name);
  if (steps.length === 0) return;
  markSeen(name);
  driver({
    steps,
    popoverClass: "kikx-tour",
    showProgress: steps.length > 1,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 12,
    smoothScroll: true,
  }).drive();
}

export function useFirstVisitTour(name: TourName, ready = true) {
  useEffect(() => {
    if (!ready || hasSeen(name)) return;
    const total = TOURS[name].length;
    const started = performance.now();
    let frame = 0;
    const tick = () => {
      const allPresent = presentSteps(name).length === total;
      if (allPresent || performance.now() - started > WAIT_FOR_TARGETS_MS) {
        startTour(name);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [name, ready]);
}

export function useStartTour(name: TourName | undefined) {
  return useCallback(() => {
    if (name) startTour(name);
  }, [name]);
}
