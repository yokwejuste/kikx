import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";
import { LANES, type ArchitectureGraph, type GraphEdge, type GraphNode, type LaneId } from "@/lib/architecture/graph";

export const NODE_WIDTH = 232;
export const NODE_HEIGHT = 64;
const LANE_PADDING = 28;
const LANE_HEADER = 44;
const LABEL_HEIGHT = 18;

export interface Point {
  x: number;
  y: number;
}

interface PlacedNode extends GraphNode {
  x: number;
  y: number;
}

interface PlacedEdge extends GraphEdge {
  points: Point[];
  labelPosition: Point | null;
}

interface PlacedLane {
  id: LaneId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArchitectureLayout {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  lanes: PlacedLane[];
}

const elk = new ELK();

function labelWidth(text: string): number {
  return Math.ceil(text.length * 6.4) + 12;
}

export async function layoutArchitecture(graph: ArchitectureGraph): Promise<ArchitectureLayout> {
  const laneIndex = new Map(LANES.map((lane, index) => [lane, index]));

  const root: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.partitioning.activate": "true",
      "elk.separateConnectedComponents": "false",
      "elk.layered.spacing.nodeNodeBetweenLayers": "96",
      "elk.layered.spacing.edgeNodeBetweenLayers": "28",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "14",
      "elk.spacing.nodeNode": "28",
      "elk.spacing.edgeNode": "18",
      "elk.spacing.edgeEdge": "12",
      "elk.spacing.edgeLabel": "4",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.mergeEdges": "false",
      "elk.padding": `[top=${LANE_HEADER + LANE_PADDING},left=${LANE_PADDING},bottom=${LANE_PADDING},right=${LANE_PADDING}]`,
    },
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      layoutOptions: { "elk.partitioning.partition": String(laneIndex.get(node.lane) ?? LANES.length) },
    })),
    edges: graph.edges.map(
      (edge): ElkExtendedEdge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
        labels: [
          {
            id: `${edge.id}:label`,
            text: edge.label,
            width: labelWidth(edge.label),
            height: LABEL_HEIGHT,
            layoutOptions: { "elk.edgeLabels.placement": "CENTER" },
          },
        ],
      }),
    ),
  };

  const result = await elk.layout(root);
  const position = new Map((result.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]));
  const height = result.height ?? 0;

  const nodes: PlacedNode[] = graph.nodes.map((node) => ({ ...node, ...(position.get(node.id) ?? { x: 0, y: 0 }) }));

  const routed = new Map((result.edges ?? []).map((edge) => [edge.id, edge]));
  const edges: PlacedEdge[] = graph.edges.map((edge) => {
    const elkEdge = routed.get(edge.id);
    const section = elkEdge?.sections?.[0];
    const points = section ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint] : [];
    const label = elkEdge?.labels?.[0];
    return {
      ...edge,
      points,
      labelPosition: label?.x !== undefined && label.y !== undefined ? { x: label.x, y: label.y } : null,
    };
  });

  const extents = LANES.map((lane) => {
    const members = nodes.filter((n) => n.lane === lane);
    if (members.length === 0) return null;
    return {
      lane,
      min: Math.min(...members.map((n) => n.x)),
      max: Math.max(...members.map((n) => n.x + NODE_WIDTH)),
    };
  }).filter((e): e is NonNullable<typeof e> => e !== null);

  const lanes: PlacedLane[] = extents.map((extent, index) => {
    const left = index === 0 ? extent.min - LANE_PADDING : (extents[index - 1].max + extent.min) / 2;
    const right =
      index === extents.length - 1 ? extent.max + LANE_PADDING : (extent.max + extents[index + 1].min) / 2;
    return { id: extent.lane, label: graph.laneLabels[extent.lane], x: left, y: 0, width: right - left, height };
  });

  return { nodes, edges, lanes };
}
