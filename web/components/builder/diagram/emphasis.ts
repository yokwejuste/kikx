import type { GraphEdge } from "@/lib/architecture/graph";

/** How a node or edge is drawn while another node is hovered. */
export type Emphasis = "normal" | "focus" | "dim";

export function edgeColor(tone: GraphEdge["tone"], emphasis: Emphasis): string {
  if (emphasis === "focus") return "var(--primary)";
  return tone === "structure" ? "var(--muted-foreground)" : "var(--foreground)";
}
