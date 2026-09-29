import type { GraphEdge } from "@/lib/architecture/graph";

export type Emphasis = "normal" | "focus" | "dim";

export function edgeColor(tone: GraphEdge["tone"], emphasis: Emphasis): string {
  if (emphasis === "focus") return "var(--primary)";
  return tone === "structure" ? "var(--muted-foreground)" : "var(--foreground)";
}
