"use client";

import { useMemo, useSyncExternalStore } from "react";
import { loadCompleted } from "@/lib/teach/progress";

const NONE = "[]";
const noopSubscribe = () => () => {};

export function useCompletedLessons(): string[] {
  const snapshot = useSyncExternalStore(noopSubscribe, () => JSON.stringify(loadCompleted()), () => NONE);
  return useMemo(() => JSON.parse(snapshot) as string[], [snapshot]);
}
