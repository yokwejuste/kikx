import { prefersReducedMotion } from "@/lib/dom/motion";

export function rectOf(element: Element | null): DOMRect | null {
  return element?.isConnected ? element.getBoundingClientRect() : null;
}

export function trackRect(rect: () => DOMRect | null, onRect: (rect: DOMRect | null) => void): () => void {
  let frame = 0;
  const follow = () => {
    onRect(rect());
    frame = requestAnimationFrame(follow);
  };
  frame = requestAnimationFrame(follow);
  return () => cancelAnimationFrame(frame);
}

export function frameRect(node: HTMLElement, rect: DOMRect, padding: number): void {
  node.style.transform = `translate(${rect.left - padding}px, ${rect.top - padding}px)`;
  node.style.width = `${rect.width + padding * 2}px`;
  node.style.height = `${rect.height + padding * 2}px`;
}

export const GLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GLIDE_MS = 280;
const FADE = "opacity 200ms";

export function glide(node: HTMLElement): void {
  if (prefersReducedMotion()) return;
  node.style.transition = ["transform", "width", "height"].map((property) => `${property} ${GLIDE_MS}ms ${GLIDE_EASE}`).concat(FADE).join(", ");
  window.setTimeout(() => {
    node.style.transition = FADE;
  }, GLIDE_MS);
}
