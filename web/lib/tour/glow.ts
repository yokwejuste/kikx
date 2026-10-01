import { frameRect, glide, rectOf, trackRect } from "@/lib/dom/track-rect";

const GLOW_CLASS = "kikx-tour-glow";

let target: Element | null = null;
let glow: HTMLDivElement | null = null;
let untrack: (() => void) | null = null;

export function glowAround(element: Element | undefined, padding: number): void {
  const moved = glow && element && element !== target;
  target = element ?? null;
  if (glow) {
    if (moved) glide(glow);
    return;
  }
  glow = document.createElement("div");
  glow.className = GLOW_CLASS;
  glow.setAttribute("aria-hidden", "true");
  document.body.append(glow);
  untrack = trackRect(
    () => rectOf(target),
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
