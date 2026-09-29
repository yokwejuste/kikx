import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { Neighbourhood } from "@/components/builder/diagram/emphasis";
import type { ArchitectureLayout } from "@/lib/architecture/layout";

function trace(start: string, next: Map<string, { edge: string; node: string }[]>, nodes: Set<string>, edges: Set<string>) {
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const step of next.get(current) ?? []) {
      edges.add(step.edge);
      nodes.add(step.node);
      if (seen.has(step.node)) continue;
      seen.add(step.node);
      queue.push(step.node);
    }
  }
}

export function useNeighbourhood(layout: ArchitectureLayout | null, hovered: string | null): Neighbourhood | null {
  const links = useMemo(() => {
    const downstream = new Map<string, { edge: string; node: string }[]>();
    const upstream = new Map<string, { edge: string; node: string }[]>();
    for (const edge of layout?.edges ?? []) {
      downstream.set(edge.source, [...(downstream.get(edge.source) ?? []), { edge: edge.id, node: edge.target }]);
      upstream.set(edge.target, [...(upstream.get(edge.target) ?? []), { edge: edge.id, node: edge.source }]);
    }
    return { downstream, upstream };
  }, [layout]);

  return useMemo(() => {
    if (!hovered || !layout) return null;
    const nodes = new Set([hovered]);
    const edges = new Set<string>();
    trace(hovered, links.downstream, nodes, edges);
    trace(hovered, links.upstream, nodes, edges);
    return { hovered, nodes, edges };
  }, [hovered, layout, links]);
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
