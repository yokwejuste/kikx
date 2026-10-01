export function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      const substitution = previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
      current.push(Math.min(previous[column] + 1, current[column - 1] + 1, substitution));
    }
    previous = current;
  }
  return previous[right.length];
}

const lastPart = (name: string): string => name.slice(name.lastIndexOf("/") + 1);

function distanceTo(typed: string, candidate: string): number {
  const full = editDistance(typed, candidate);
  return candidate.includes("/") && !typed.includes("/") ? Math.min(full, editDistance(typed, lastPart(candidate))) : full;
}

export function closestName(typed: string, candidates: string[]): string | null {
  const word = typed.trim().toLowerCase();
  if (!word || candidates.includes(typed)) return null;
  const limit = Math.max(2, Math.ceil(word.length / 2));
  let best: { name: string; distance: number } | null = null;
  for (const name of candidates) {
    const distance = distanceTo(word, name.toLowerCase());
    if (distance <= limit && (best === null || distance < best.distance)) best = { name, distance };
  }
  return best?.name ?? null;
}
