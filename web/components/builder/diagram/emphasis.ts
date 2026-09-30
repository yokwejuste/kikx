import { createContext, useContext } from "react";
import type { GraphEdge } from "@/lib/architecture/graph";

export type Emphasis = "normal" | "focus" | "dim";

export interface Neighbourhood {
  hovered: string;
  nodes: Set<string>;
  edges: Set<string>;
}

export const NeighbourhoodContext = createContext<Neighbourhood | null>(null);

export function useNodeEmphasis(id: string): Emphasis {
  const neighbourhood = useContext(NeighbourhoodContext);
  if (!neighbourhood) return "normal";
  if (id === neighbourhood.hovered) return "focus";
  return neighbourhood.nodes.has(id) ? "normal" : "dim";
}

export function useEdgeEmphasis(id: string): Emphasis {
  const neighbourhood = useContext(NeighbourhoodContext);
  if (!neighbourhood) return "normal";
  return neighbourhood.edges.has(id) ? "focus" : "dim";
}

export function edgeColor(tone: GraphEdge["tone"], emphasis: Emphasis): string {
  if (emphasis === "focus") return "var(--brand)";
  return tone === "structure" ? "var(--muted-foreground)" : "var(--foreground)";
}
