import type { DemoValue, Lesson, LessonStep } from "@/lib/teach/lessons";
import { findVisible, isComfortablyVisible, pressElement, pressKey, setInputValue } from "@/lib/teach/dom";

export type LessonStatus = "playing" | "paused" | "lost" | "done";

export interface LessonView {
  status: LessonStatus;
  step: number;
  total: number;
  caption: string | null;
  target: HTMLElement | null;
  clicks: number;
  speed: number;
}

export interface LessonEnv {
  say: (key: string) => string;
  value: (value: DemoValue) => string;
  navigate: (path: string) => void;
  reducedMotion: boolean;
  speed: number;
  onChange: (view: LessonView) => void;
}

class Stopped extends Error {}
class Lost extends Error {}

const TICK_MS = 50;
const FIND_TIMEOUT_MS = 10000;
const OPTIONAL_TIMEOUT_MS = 1500;
const SCROLL_SETTLE_MS = 450;
const TYPE_MS = 70;
const AFTER_ACTION_MS = 350;

export const CURSOR_MOVE_MS = 650;

function readingTime(text: string): number {
  return Math.min(9000, Math.max(2400, 1200 + text.length * 50));
}

export class LessonPlayer {
  private status: LessonStatus = "playing";
  private step = 0;
  private caption: string | null = null;
  private target: HTMLElement | null = null;
  private clicks = 0;
  private stopped = false;
  private skipping = false;
  private speed: number;

  constructor(
    private readonly lesson: Lesson,
    private readonly env: LessonEnv,
  ) {
    this.speed = env.speed;
  }

  async play(): Promise<void> {
    this.emit();
    while (this.step < this.lesson.steps.length) {
      try {
        this.skipping = false;
        await this.perform(this.lesson.steps[this.step]);
        this.step++;
        this.emit();
      } catch (error) {
        if (error instanceof Stopped) return;
        if (!(error instanceof Lost)) throw error;
        this.setStatus("lost");
        await this.untilPlaying();
      }
    }
    this.target = null;
    this.setStatus("done");
  }

  pause(): void {
    if (this.status === "playing") this.setStatus("paused");
  }

  resume(): void {
    if (this.status === "paused" || this.status === "lost") this.setStatus("playing");
  }

  next(): void {
    if (this.status === "playing") this.skipping = true;
  }

  stop(): void {
    this.stopped = true;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.emit();
  }

  private emit(): void {
    this.env.onChange({
      status: this.status,
      step: Math.min(this.step + 1, this.lesson.steps.length),
      total: this.lesson.steps.length,
      caption: this.caption,
      target: this.target,
      clicks: this.clicks,
      speed: this.speed,
    });
  }

  private setStatus(status: LessonStatus): void {
    this.status = status;
    this.emit();
  }

  private async perform(step: LessonStep): Promise<void> {
    switch (step.kind) {
      case "go":
        if (window.location.pathname !== step.path) {
          this.env.navigate(step.path);
          if (!(await this.until(() => window.location.pathname === step.path, FIND_TIMEOUT_MS))) throw new Lost();
        }
        return;
      case "say":
        this.target = null;
        this.speak(step.say);
        await this.read();
        return;
      case "point":
        this.speak(step.say);
        await this.reach(step.target);
        await this.read();
        return;
      case "click": {
        if (step.say) this.speak(step.say);
        const element = await this.reach(step.target, step.optional);
        if (!element) return;
        if (step.say) await this.read();
        this.click(element);
        await this.wait(AFTER_ACTION_MS, false);
        return;
      }
      case "type": {
        if (step.say) this.speak(step.say);
        const element = await this.reach(step.target);
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) throw new Lost();
        this.click(element);
        await this.typeInto(element, this.env.value(step.value));
        if (step.enter) pressKey("Enter");
        element.blur();
        if (step.say) await this.read();
        else await this.wait(AFTER_ACTION_MS, false);
        return;
      }
      case "key":
        pressKey(step.key);
        await this.wait(AFTER_ACTION_MS, false);
        return;
    }
  }

  private speak(key: string): void {
    this.caption = this.env.say(key);
    this.emit();
  }

  private click(element: HTMLElement): void {
    this.clicks++;
    this.emit();
    pressElement(element);
  }

  private async typeInto(element: HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
    setInputValue(element, "");
    for (let length = 1; length <= text.length; length++) {
      setInputValue(element, text.slice(0, length));
      if (!this.env.reducedMotion) await this.wait(TYPE_MS, false);
    }
  }

  private async reach(selector: string, optional = false): Promise<HTMLElement | null> {
    let element: HTMLElement | null = null;
    const found = await this.until(() => (element = findVisible(selector)) !== null, optional ? OPTIONAL_TIMEOUT_MS : FIND_TIMEOUT_MS);
    if (!found || !element) {
      if (optional) return null;
      throw new Lost();
    }
    const target: HTMLElement = element;
    if (!isComfortablyVisible(target)) {
      target.scrollIntoView({ block: "center", behavior: this.env.reducedMotion ? "auto" : "smooth" });
      await this.wait(SCROLL_SETTLE_MS, false);
    }
    this.target = target;
    this.emit();
    if (!this.env.reducedMotion) await this.wait(CURSOR_MOVE_MS, false);
    return target;
  }

  private async read(): Promise<void> {
    await this.wait(readingTime(this.caption ?? ""));
  }

  private async until(condition: () => boolean, timeout: number): Promise<boolean> {
    let waited = 0;
    while (!condition()) {
      if (waited >= timeout) return false;
      await this.wait(TICK_MS * 2, false, false);
      waited += TICK_MS * 2;
    }
    return true;
  }

  private async untilPlaying(): Promise<void> {
    while (this.status !== "playing") {
      if (this.stopped) throw new Stopped();
      await new Promise((resolve) => setTimeout(resolve, TICK_MS));
    }
  }

  private async wait(ms: number, skippable = true, scaled = true): Promise<void> {
    let remaining = ms;
    while (remaining > 0) {
      if (this.stopped) throw new Stopped();
      if (skippable && this.skipping) return;
      await new Promise((resolve) => setTimeout(resolve, TICK_MS));
      if (this.status === "playing") remaining -= scaled ? TICK_MS * this.speed : TICK_MS;
    }
    if (this.stopped) throw new Stopped();
  }
}
