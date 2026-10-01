import { frameRect, trackRect } from "@/lib/dom/track-rect";

const GLOW_CLASS = "kikx-tour-glow";

let target: Element | null = null;
let glow: HTMLDivElement | null = null;
let untrack: (() => void) | null = null;

export function glowAround(element: Element | undefined, padding: number, radius: number): void {
  target = element ?? null;
  if (glow) return;
  glow = document.createElement("div");
  glow.className = GLOW_CLASS;
  glow.setAttribute("aria-hidden", "true");
  glow.style.borderRadius = `${radius}px`;
  document.body.append(glow);
  untrack = trackRect(
    () => target,
    (rect) => {
      if (!glow) return;
      glow.style.opacity = rect ? "1" : "0";
      if (rect) frameRect(glow, rect, padding);
    },
  );
}

export function stopGlow(): void {
  untrack?.();
  glow?.remove();
  untrack = null;
  glow = null;
  target = null;
}
