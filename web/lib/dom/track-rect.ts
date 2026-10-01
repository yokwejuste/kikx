export function trackRect(element: () => Element | null, onRect: (rect: DOMRect | null) => void): () => void {
  let frame = 0;
  const follow = () => {
    const current = element();
    onRect(current?.isConnected ? current.getBoundingClientRect() : null);
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
