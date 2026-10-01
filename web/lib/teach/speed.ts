export const LESSON_SPEEDS = [0.5, 1, 1.5, 2];

const SPEED_KEY = "kikx-teach:speed";
const DEFAULT_SPEED = 1;

export function loadSpeed(): number {
  try {
    const stored = Number(localStorage.getItem(SPEED_KEY));
    return LESSON_SPEEDS.includes(stored) ? stored : DEFAULT_SPEED;
  } catch {
    return DEFAULT_SPEED;
  }
}

export function saveSpeed(speed: number): void {
  try {
    localStorage.setItem(SPEED_KEY, String(speed));
  } catch {
    return;
  }
}
