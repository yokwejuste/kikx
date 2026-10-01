import type { Lesson, LessonStep, Target, TaskCheck, TextRef } from "@/lib/teach/types";
import {
  closedDrawerTrigger,
  findElement,
  isComfortablyVisible,
  isTypingTarget,
  openDrawer,
  pressElement,
  pressKey,
  releaseFocus,
  setInputValue,
  type TypingTarget,
} from "@/lib/teach/dom";
import { readingTime, typingDelay } from "@/lib/teach/pacing";

export type LessonStatus = "playing" | "paused" | "task" | "lost" | "done";

export interface LessonChapter {
  index: number;
  total: number;
  title: string;
}

export interface LessonTaskCheck {
  label: string;
  done: boolean;
}

export interface LessonView {
  status: LessonStatus;
  step: number;
  total: number;
  caption: string | null;
  target: HTMLElement | null;
  clicks: number;
  speed: number;
  chapter: LessonChapter | null;
  learn: string | null;
  task: LessonTaskCheck[] | null;
  waiting: boolean;
}

export interface LessonEnv {
  say: (key: string) => string;
  chapter: (key: string) => string;
  check: (key: string) => string;
  praise: () => string;
  text: (ref: TextRef) => string;
  navigate: (path: string) => void;
  reducedMotion: boolean;
  speed: number;
  onChange: (view: LessonView) => void;
  onComplete: () => void;
}

class Stopped extends Error {}
class Lost extends Error {}

const TICK_MS = 50;
const TASK_POLL_MS = 250;
const PRAISE_MS = 1400;
const FIND_TIMEOUT_MS = 10000;
const OPTIONAL_TIMEOUT_MS = 1500;
const REVEAL_AFTER_MS = 1200;
const SCROLL_SETTLE_MS = 450;
const WAITING_AFTER_MS = 600;
const PAGE_BEAT_MS = 600;
const AFTER_ACTION_MS = 350;

export const CURSOR_MOVE_MS = 650;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class LessonPlayer {
  private status: LessonStatus = "playing";
  private step = 0;
  private caption: string | null = null;
  private target: HTMLElement | null = null;
  private targetRef: Target | null = null;
  private clicks = 0;
  private stopped = false;
  private skipping = false;
  private showRequested = false;
  private speed: number;
  private chapter: LessonChapter | null = null;
  private learn: string | null = null;
  private task: LessonTaskCheck[] | null = null;
  private waiting = false;
  private readonly chapterTotal: number;

  constructor(
    private readonly lesson: Lesson,
    private readonly env: LessonEnv,
  ) {
    this.speed = env.speed;
    this.chapterTotal = lesson.steps.filter((step) => step.kind === "chapter").length;
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
        this.task = null;
        this.setStatus("lost");
        await this.untilPlaying();
      }
    }
    this.target = null;
    releaseFocus();
    this.setStatus("done");
    this.env.onComplete();
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

  showMe(): void {
    if (this.status === "task") this.showRequested = true;
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
      chapter: this.chapter,
      learn: this.learn,
      task: this.task,
      waiting: this.waiting,
    });
  }

  private setStatus(status: LessonStatus): void {
    this.status = status;
    this.emit();
  }

  private async perform(step: LessonStep): Promise<void> {
    switch (step.kind) {
      case "chapter":
        this.chapter = {
          index: (this.chapter?.index ?? 0) + 1,
          total: this.chapterTotal,
          title: this.env.chapter(step.chapter),
        };
        this.learn = null;
        this.emit();
        return;
      case "go":
        this.target = null;
        this.targetRef = null;
        if (window.location.pathname !== step.path) {
          this.env.navigate(step.path);
          if (!(await this.until(() => window.location.pathname === step.path, FIND_TIMEOUT_MS))) throw new Lost();
          await this.wait(PAGE_BEAT_MS, false);
        }
        return;
      case "say":
        this.narrate(step);
        await this.read();
        return;
      case "point":
        this.narrate(step);
        await this.reach(step.target);
        await this.read();
        return;
      case "click": {
        this.narrate(step);
        const element = await this.reach(step.target, step.optional);
        if (!element) return;
        if (step.say) await this.read();
        const page = window.location.pathname;
        this.click(element);
        await this.wait(AFTER_ACTION_MS, false);
        if (window.location.pathname !== page) await this.wait(PAGE_BEAT_MS, false);
        return;
      }
      case "type": {
        this.narrate(step);
        const element = await this.reach(step.target);
        if (!element || !isTypingTarget(element)) throw new Lost();
        this.click(element);
        await this.typeInto(element, this.env.text(step.value), step.instant);
        if (step.enter) pressKey("Enter");
        element.blur();
        if (step.say) await this.read();
        else await this.wait(AFTER_ACTION_MS, false);
        return;
      }
      case "choose": {
        this.narrate(step);
        const element = await this.reach(step.target);
        if (!(element instanceof HTMLSelectElement)) throw new Lost();
        this.click(element);
        setInputValue(element, this.env.text(step.value));
        if (step.say) await this.read();
        else await this.wait(AFTER_ACTION_MS, false);
        return;
      }
      case "key":
        pressKey(step.key);
        await this.wait(AFTER_ACTION_MS, false);
        return;
      case "task":
        await this.practise(step);
        return;
    }
  }

  private async practise(step: Extract<LessonStep, { kind: "task" }>): Promise<void> {
    this.target = null;
    this.narrate(step);
    this.showRequested = false;
    this.task = this.checkTask(step.checks);
    this.setStatus("task");
    while (!this.task.every((check) => check.done)) {
      if (this.stopped) throw new Stopped();
      if (this.showRequested) {
        this.showRequested = false;
        this.task = null;
        this.setStatus("playing");
        for (const shown of step.show) await this.perform(shown);
        return;
      }
      await sleep(TASK_POLL_MS);
      const next = this.checkTask(step.checks);
      if (next.some((check, index) => check.done !== this.task?.[index]?.done)) {
        this.task = next;
        this.emit();
      }
    }
    this.task = null;
    this.caption = this.env.praise();
    this.setStatus("playing");
    await this.wait(PRAISE_MS, false);
  }

  private checkTask(checks: TaskCheck[]): LessonTaskCheck[] {
    return checks.map((check) => ({ label: this.env.check(check.label), done: this.find(check.target, false) !== null }));
  }

  private narrate(step: { say?: string; learn?: string }): void {
    if (step.learn) this.learn = step.learn;
    if (step.say) {
      this.caption = this.env.say(step.say);
      this.emit();
    }
  }

  private click(element: HTMLElement): void {
    this.clicks++;
    this.emit();
    pressElement(element);
  }

  private async typeInto(element: TypingTarget, text: string, instant = false): Promise<void> {
    if (instant || this.env.reducedMotion) {
      setInputValue(element, text);
      return;
    }
    setInputValue(element, "");
    for (let length = 1; length <= text.length; length++) {
      setInputValue(element, text.slice(0, length));
      await this.wait(typingDelay(text[length - 1], Math.random()), false);
    }
  }

  private find(target: Target, visible = true): HTMLElement | null {
    if (typeof target === "string") return findElement(target, undefined, visible);
    return findElement(target.selector, this.env.text(target.text), visible);
  }

  private async locate(target: Target, timeout: number): Promise<HTMLElement | null> {
    let element: HTMLElement | null = null;
    const found = await this.until(() => (element = this.find(target)) !== null, timeout);
    return found ? element : null;
  }

  private async reveal(target: Target, timeout: number): Promise<HTMLElement | null> {
    const element = await this.locate(target, Math.min(REVEAL_AFTER_MS, timeout));
    if (element) return element;
    const trigger = closedDrawerTrigger();
    if (!trigger) return this.locate(target, timeout - REVEAL_AFTER_MS);
    this.click(trigger);
    await this.wait(AFTER_ACTION_MS, false);
    return this.locate(target, timeout);
  }

  private async reach(target: Target, optional = false): Promise<HTMLElement | null> {
    let element = await this.reveal(target, optional ? OPTIONAL_TIMEOUT_MS : FIND_TIMEOUT_MS);
    const drawer = openDrawer();
    if (element && drawer && !drawer.contains(element)) {
      pressKey("Escape");
      await this.wait(AFTER_ACTION_MS, false);
      element = await this.locate(target, FIND_TIMEOUT_MS);
    }
    if (!element) {
      if (optional) return null;
      throw new Lost();
    }
    const reached: HTMLElement = element;
    const scrolls = !isComfortablyVisible(reached);
    this.target = reached;
    this.targetRef = target;
    this.emit();
    if (scrolls) reached.scrollIntoView({ block: "center", behavior: this.env.reducedMotion ? "auto" : "smooth" });
    const settle = Math.max(scrolls ? SCROLL_SETTLE_MS : 0, this.env.reducedMotion ? 0 : CURSOR_MOVE_MS);
    if (settle > 0) await this.wait(settle, false);
    return reached;
  }

  private refindTarget(): void {
    if (!this.target || this.target.isConnected || !this.targetRef) return;
    const replacement = this.find(this.targetRef);
    if (!replacement) return;
    this.target = replacement;
    this.emit();
  }

  private async read(): Promise<void> {
    await this.wait(readingTime(this.caption ?? ""));
  }

  private async until(condition: () => boolean, timeout: number): Promise<boolean> {
    let waited = 0;
    try {
      while (!condition()) {
        if (waited >= timeout) return false;
        if (waited >= WAITING_AFTER_MS && !this.waiting) {
          this.waiting = true;
          this.emit();
        }
        await this.wait(TICK_MS * 2, false, false);
        waited += TICK_MS * 2;
      }
      return true;
    } finally {
      if (this.waiting) {
        this.waiting = false;
        this.emit();
      }
    }
  }

  private async untilPlaying(): Promise<void> {
    while (this.status !== "playing") {
      if (this.stopped) throw new Stopped();
      await sleep(TICK_MS);
    }
  }

  private async wait(ms: number, skippable = true, scaled = true): Promise<void> {
    let remaining = ms;
    while (remaining > 0) {
      if (this.stopped) throw new Stopped();
      if (skippable && this.skipping) return;
      await sleep(TICK_MS);
      this.refindTarget();
      if (this.status === "playing") remaining -= scaled ? TICK_MS * this.speed : TICK_MS;
    }
    if (this.stopped) throw new Stopped();
  }
}
