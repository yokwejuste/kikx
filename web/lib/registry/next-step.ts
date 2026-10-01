export function nextStep<K>(stages: readonly (readonly K[])[], present: ReadonlySet<K>, added: K): K | null {
  const order = stages.flat();
  const start = order.indexOf(added);
  if (start === -1) return null;
  return order.slice(start + 1).find((kind) => !present.has(kind)) ?? null;
}
