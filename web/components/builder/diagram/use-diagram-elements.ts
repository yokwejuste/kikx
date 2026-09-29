import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { Neighbourhood } from "@/components/builder/diagram/emphasis";
import type { ArchitectureLayout } from "@/lib/architecture/layout";

export function useNeighbourhood(layout: ArchitectureLayout | null, hovered: string | null): Neighbourhood | null {
  return useMemo(() => {
    if (!hovered || !layout) return null;
    const nodes = new Set([hovered]);
    const edges = new Set<string>();
    for (const edge of layout.edges) {
      if (edge.source === hovered || edge.target === hovered) {
        edges.add(edge.id);
        nodes.add(edge.source);
        nodes.add(edge.target);
      }
    }
    return { hovered, nodes, edges };
  }, [hovered, layout]);
}

export function useDiagramElements(layout: ArchitectureLayout | null) {
  const nodes: Node[] = useMemo(() => {
    if (!layout) return [];
    const lanes: Node[] = layout.lanes.map((lane, index) => ({
      id: `lane:${lane.id}`,
      type: "lane",
      position: { x: lane.x, y: lane.y },
      data: { label: lane.label, width: lane.width, height: lane.height, shaded: index % 2 === 0 },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
    }));
    const components: Node[] = layout.nodes.map((node) => ({
      id: node.id,
      type: "diagram",
      position: { x: node.x, y: node.y },
      data: node.data,
      draggable: false,
    }));
    return [...lanes, ...components];
  }, [layout]);

  const edges: Edge[] = useMemo(() => {
    if (!layout) return [];
    return layout.edges
      .filter((edge) => edge.points.length >= 2)
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "routed",
        data: { points: edge.points, label: edge.label, labelPosition: edge.labelPosition, tone: edge.tone },
      }));
  }, [layout]);

  return { nodes, edges };
}
