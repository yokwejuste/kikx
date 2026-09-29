export function firstError(node: unknown, path: string[] = []): { path: string; message: string } | null {
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  if (typeof record.message === "string" && record.message) {
    const readablePath = path.map((p) => (/^\d+$/.test(p) ? String(Number(p) + 1) : p)).join(" › ");
    return { path: readablePath || "form", message: record.message };
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === "ref" || key === "type") continue;
    const found = firstError(child, [...path, key]);
    if (found) return found;
  }
  return null;
}

export function hasDirtyField(node: unknown): boolean {
  if (node === true) return true;
  if (Array.isArray(node)) return node.some(hasDirtyField);
  if (node && typeof node === "object") return Object.values(node).some(hasDirtyField);
  return false;
}
