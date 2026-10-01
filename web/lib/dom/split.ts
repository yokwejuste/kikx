export const DEFAULT_SPLIT = 0.5;
export const SPLIT_STEP = 0.02;

export function clampSplit(ratio: number, width: number, minPx: number): number {
  const floor = width > 0 ? Math.min(DEFAULT_SPLIT, minPx / width) : 0;
  return Math.min(1 - floor, Math.max(floor, ratio));
}

export function splitFromKey(key: string, ratio: number): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return ratio - SPLIT_STEP;
    case "ArrowRight":
    case "ArrowDown":
      return ratio + SPLIT_STEP;
    case "Home":
      return 0;
    case "End":
      return 1;
    default:
      return null;
  }
}
