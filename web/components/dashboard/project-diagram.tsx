"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  useNodesInitialized,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { Download, LoaderCircle, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowNodeData } from "@/components/flow/flow-node";
import { buildArchitectureGraph, type GraphEdge } from "@/lib/architecture-graph";
import { layoutArchitecture, NODE_HEIGHT, NODE_WIDTH, type ArchitectureLayout, type Point } from "@/lib/architecture-layout";
import { downloadDrawio } from "@/lib/drawio-export";
import { useProject, type AddedComponent } from "@/lib/project-context";
import { cn } from "@/lib/utils";

type Emphasis = "normal" | "focus" | "dim";

interface DiagramNodeData extends FlowNodeData {
  emphasis: Emphasis;
}

interface LaneNodeData {
  [key: string]: unknown;
  label: string;
  width: number;
  height: number;
  shaded: boolean;
}

interface RoutedEdgeData {
  [key: string]: unknown;
  points: Point[];
  label: string;
  labelPosition: Point | null;
  tone: GraphEdge["tone"];
  emphasis: Emphasis;
}

const DiagramNode = memo(function DiagramNode({ data }: NodeProps) {
  const { label, description, icon: Icon, kind, emphasis } = data as DiagramNodeData;
  return (
    <div
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={cn(
        "flex cursor-pointer flex-col justify-center gap-1 rounded-lg border bg-card px-3 shadow-sm transition-[opacity,box-shadow] duration-150",
        kind === "data" && "border-dashed",
        emphasis === "focus" && "border-primary ring-2 ring-primary/30",
        emphasis === "dim" && "opacity-30",
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" isConnectable={false} />
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        <span className="truncate font-mono text-xs font-medium">{label}</span>
      </div>
      <p className="truncate pl-8 text-[11px] text-muted-foreground">{description}</p>
      <Handle type="source" position={Position.Right} className="!opacity-0" isConnectable={false} />
    </div>
  );
});

function LaneNode({ data }: NodeProps) {
  const { label, width, height, shaded } = data as LaneNodeData;
  return (
    <div
      style={{ width, height }}
      className={cn("pointer-events-none border-x border-border/60", shaded ? "bg-muted/25" : "bg-transparent")}
    >
      <div className="border-b border-border/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  );
}

/** An orthogonal polyline through the layout's points, with softly rounded corners. */
function roundedPath(points: Point[], radius = 8): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [prev, cur, next] = [points[i - 1], points[i], points[i + 1]];
    const toward = (to: Point, distance: number) => {
      const length = Math.hypot(to.x - cur.x, to.y - cur.y) || 1;
      return { x: cur.x + ((to.x - cur.x) / length) * distance, y: cur.y + ((to.y - cur.y) / length) * distance };
    };
    const r = Math.min(
      radius,
      Math.hypot(prev.x - cur.x, prev.y - cur.y) / 2,
      Math.hypot(next.x - cur.x, next.y - cur.y) / 2,
    );
    const a = toward(prev, r);
    const b = toward(next, r);
    d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${b.x} ${b.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

function RoutedEdge({ id, data, markerEnd }: EdgeProps) {
  const { points, label, labelPosition, tone, emphasis } = data as RoutedEdgeData;
  const stroke =
    emphasis === "focus" ? "var(--primary)" : tone === "structure" ? "var(--muted-foreground)" : "var(--foreground)";
  return (
    <>
      <BaseEdge
        id={id}
        path={roundedPath(points)}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: emphasis === "focus" ? 2 : 1.25,
          strokeDasharray: tone === "structure" ? "5 4" : undefined,
          opacity: emphasis === "dim" ? 0.12 : tone === "structure" ? 0.7 : 0.85,
          transition: "opacity 150ms",
        }}
      />
      {labelPosition && emphasis !== "dim" && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(${labelPosition.x}px, ${labelPosition.y}px)` }}
            className={cn(
              "pointer-events-none absolute rounded border bg-card px-1.5 text-[10px] leading-4 whitespace-nowrap",
              emphasis === "focus" ? "border-primary text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/** Fits the whole diagram once React Flow has measured the nodes — fitView-on-init can run too early. */
function FitWhenReady({ layoutKey }: { layoutKey: string }) {
  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (initialized) fitView({ padding: 0.06, duration: 0 });
  }, [initialized, fitView, layoutKey]);
  return null;
}

const nodeTypes = { diagram: DiagramNode, lane: LaneNode };
const edgeTypes = { routed: RoutedEdge };

export function ProjectDiagram({ onOpen }: { onOpen?: (component: AddedComponent) => void }) {
  const { resolvedTheme } = useTheme();
  const { details, components } = useProject();
  const graph = useMemo(() => buildArchitectureGraph(components), [components]);
  const [layout, setLayout] = useState<ArchitectureLayout | null>(null);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    layoutArchitecture(graph)
      .then((next) => {
        if (cancelled) return;
        setLayout(next);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [graph]);

  // Hovering a node highlights it, its neighbours and the edges between them; the rest fades.
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

  const flowNodes: Node[] = useMemo(() => {
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
    const nodes: Node[] = layout.nodes.map((node) => ({
      id: node.id,
      type: "diagram",
      position: { x: node.x, y: node.y },
      data: {
        ...node.data,
        emphasis: !neighbourhood
          ? "normal"
          : node.id === hovered
            ? "focus"
            : neighbourhood.nodes.has(node.id)
              ? "normal"
              : "dim",
      },
      draggable: false,
    }));
    return [...lanes, ...nodes];
  }, [layout, neighbourhood, hovered]);

  const flowEdges: Edge[] = useMemo(() => {
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
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color:
              emphasis === "focus"
                ? "var(--primary)"
                : edge.tone === "structure"
                  ? "var(--muted-foreground)"
                  : "var(--foreground)",
          },
        };
      });
  }, [layout, neighbourhood]);

  if (components.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add a component to see the architecture start forming.
      </div>
    );
  }

  // Remount (and so re-fit the view) whenever the shape of the diagram changes.
  const layoutKey = layout
    ? `${layout.nodes.length}:${layout.edges.length}:${layout.lanes.map((l) => Math.round(l.width)).join(",")}`
    : "pending";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden>
              <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            uses / targets
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden>
              <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" />
            </svg>
            inventory structure
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded-sm border border-dashed border-current" />
            data (groups, vars)
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <Minimize2 /> : <Maximize2 />}
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!layout}
            onClick={() => layout && downloadDrawio(layout, `${details?.name || "kikx"}-architecture`)}
          >
            <Download />
            Export to draw.io
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card transition-[height]",
          expanded ? "h-[80vh]" : "h-[620px]",
        )}
      >
        {!layout && !failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Arranging diagram…
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-destructive">
            Couldn&apos;t lay out this diagram.
          </div>
        )}
        {layout && (
          <ReactFlowProvider>
            <ReactFlow
              key={`${layoutKey}:${expanded}`}
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              colorMode={resolvedTheme === "dark" ? "dark" : "light"}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.1}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              onNodeMouseEnter={(_, node) => node.type === "diagram" && setHovered(node.id)}
              onNodeMouseLeave={() => setHovered(null)}
              onNodeClick={(_, node) => {
                const owner = components.find((c) => node.id === c.id || node.id.startsWith(`${c.id}:`));
                if (owner) onOpen?.(owner);
              }}
            >
              <FitWhenReady layoutKey={`${layoutKey}:${expanded}`} />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Laid out left to right in the order things happen. Hover a node to trace its connections, click it to edit.
        Export to draw.io to keep refining the diagram by hand.
      </p>
    </div>
  );
}
