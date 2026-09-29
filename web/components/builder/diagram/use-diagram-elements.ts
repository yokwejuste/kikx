import { useMemo } from "react";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { edgeColor, type Emphasis } from "@/components/builder/diagram/emphasis";
import type { ArchitectureLayout } from "@/lib/architecture/layout";

export function useDiagramElements(layout: ArchitectureLayout | null, hovered: string | null) {
  const neighbourhood = useMemo(() => {
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
    return { nodes, edges };
  }, [hovered, layout]);

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
    const components: Node[] = layout.nodes.map((node) => {
      const emphasis: Emphasis = !neighbourhood
        ? "normal"
        : node.id === hovered
          ? "focus"
          : neighbourhood.nodes.has(node.id)
            ? "normal"
            : "dim";
      return {
        id: node.id,
        type: "diagram",
        position: { x: node.x, y: node.y },
        data: { ...node.data, emphasis },
        draggable: false,
      };
    });
    return [...lanes, ...components];
  }, [layout, neighbourhood, hovered]);

  const edges: Edge[] = useMemo(() => {
    if (!layout) return [];
    return layout.edges
      .filter((edge) => edge.points.length >= 2)
      .map((edge) => {
        const emphasis: Emphasis = !neighbourhood ? "normal" : neighbourhood.edges.has(edge.id) ? "focus" : "dim";
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "routed",
          data: { points: edge.points, label: edge.label, labelPosition: edge.labelPosition, tone: edge.tone, emphasis },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: edgeColor(edge.tone, emphasis) },
        };
      });
  }, [layout, neighbourhood]);

  return { nodes, edges };
}
