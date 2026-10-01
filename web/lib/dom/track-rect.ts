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
