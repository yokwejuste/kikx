const CAPTION_CLEARANCE = 200;
const HEADER_CLEARANCE = 72;

function shownText(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return element.value;
  }
  return element.textContent ?? "";
}

const DRAWER_TRIGGER = '[data-teach="project-drawer"]';
const OPEN_DRAWER = '[data-slot="sheet-content"]';

export function findElement(selector: string, text?: string, visible = true): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const disabled = element instanceof HTMLButtonElement && element.disabled;
    const matches = text === undefined || shownText(element).includes(text);
    if (!disabled && matches && (!visible || element.getClientRects().length > 0)) return element;
  }
  return null;
}

export function findVisible(selector: string, text?: string): HTMLElement | null {
  return findElement(selector, text);
}

export function closedDrawerTrigger(): HTMLElement | null {
  return document.querySelector(OPEN_DRAWER) ? null : findVisible(DRAWER_TRIGGER);
}

export function openDrawer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(OPEN_DRAWER);
}

export function isComfortablyVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top >= HEADER_CLEARANCE && rect.bottom <= window.innerHeight - CAPTION_CLEARANCE;
}

function pointerInit(element: Element, buttons: number): PointerEventInit {
  const rect = element.getBoundingClientRect();
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    button: 0,
    buttons,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    pointerType: "mouse",
    isPrimary: true,
  };
}

export function pressElement(element: HTMLElement): void {
  element.dispatchEvent(new PointerEvent("pointerover", pointerInit(element, 0)));
  element.dispatchEvent(new PointerEvent("pointermove", pointerInit(element, 0)));
  element.dispatchEvent(new PointerEvent("pointerdown", pointerInit(element, 1)));
  element.dispatchEvent(new MouseEvent("mousedown", pointerInit(element, 1)));
  element.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  element.dispatchEvent(new PointerEvent("pointerup", pointerInit(element, 0)));
  element.dispatchEvent(new MouseEvent("mouseup", pointerInit(element, 0)));
  element.click();
}

export function setInputValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

export function pressKey(key: string): void {
  const target = document.activeElement ?? document.body;
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }));
}

export function highlightRect(element: HTMLElement | null): DOMRect | null {
  if (!element?.isConnected) return null;
  const rect = (element.closest("[data-teach-frame]") ?? element).getBoundingClientRect();
  const block = element.hasAttribute("data-line") ? element.closest("pre") : null;
  if (!block) return rect;
  const lines = block.getBoundingClientRect();
  return new DOMRect(lines.left, rect.top, lines.width, rect.height);
}

export function releaseFocus(): void {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
