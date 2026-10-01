const CAPTION_CLEARANCE = 200;
const HEADER_CLEARANCE = 72;

export function findVisible(selector: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const disabled = element instanceof HTMLButtonElement && element.disabled;
    if (!disabled && element.getClientRects().length > 0) return element;
  }
  return null;
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
  element.dispatchEvent(new PointerEvent("pointerdown", pointerInit(element, 1)));
  element.dispatchEvent(new MouseEvent("mousedown", pointerInit(element, 1)));
  element.focus({ preventScroll: true });
  element.dispatchEvent(new PointerEvent("pointerup", pointerInit(element, 0)));
  element.dispatchEvent(new MouseEvent("mouseup", pointerInit(element, 0)));
  element.click();
}

export function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export function pressKey(key: string): void {
  const target = document.activeElement ?? document.body;
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
