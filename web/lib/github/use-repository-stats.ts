"use client";

import { useEffect, useState } from "react";
import { parseStats, STATS_HEADERS, STATS_URL, type RepositoryStats } from "@/lib/github/stats";

const CACHE_KEY = "kikx-github:stats";
const FRESH_MS = 10 * 60 * 1000;

interface CachedStats {
  at: number;
  stats: RepositoryStats;
}

function cached(): RepositoryStats | null {
  try {
    const entry = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as CachedStats | null;
    return entry && Date.now() - entry.at < FRESH_MS ? entry.stats : null;
  } catch {
    return null;
  }
}

function remember(stats: RepositoryStats): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), stats } satisfies CachedStats));
  } catch {}
}

let pending: Promise<RepositoryStats | null> | null = null;

function latest(): Promise<RepositoryStats | null> {
  const fresh = cached();
  if (fresh) return Promise.resolve(fresh);
  pending ??= fetch(STATS_URL, { headers: STATS_HEADERS })
    .then(async (response) => (response.ok ? parseStats(await response.json()) : null))
    .catch(() => null)
    .then((stats) => {
      if (stats) remember(stats);
      return stats;
    });
  return pending;
}

export function useRepositoryStats(initial: RepositoryStats | null): RepositoryStats | null {
  const [stats, setStats] = useState(initial);
  useEffect(() => {
    let active = true;
    void latest().then((value) => {
      if (active && value) setStats(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return stats;
}
