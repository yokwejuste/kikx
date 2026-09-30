import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { edgeColor, useEdgeEmphasis } from "@/components/builder/diagram/emphasis";
import type { GraphEdge } from "@/lib/architecture/graph";
import type { Point } from "@/lib/architecture/layout";
import { cn } from "@/lib/utils";

interface RoutedEdgeData {
  [key: string]: unknown;
  points: Point[];
  label: string;
  labelPosition: Point | null;
  tone: GraphEdge["tone"];
}

const ARROW_LENGTH = 9;
const ARROW_HALF_WIDTH = 4.5;

function arrowhead(points: Point[]) {
  const tip = points[points.length - 1];
  const from = points[points.length - 2];
  const length = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const ux = (tip.x - from.x) / length;
  const uy = (tip.y - from.y) / length;
  const base = { x: tip.x - ux * ARROW_LENGTH, y: tip.y - uy * ARROW_LENGTH };
  const left = { x: base.x - uy * ARROW_HALF_WIDTH, y: base.y + ux * ARROW_HALF_WIDTH };
  const right = { x: base.x + uy * ARROW_HALF_WIDTH, y: base.y - ux * ARROW_HALF_WIDTH };
  return { base, shape: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z` };
}

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

export function RoutedEdge({ id, data }: EdgeProps) {
  const { points, label, labelPosition, tone } = data as RoutedEdgeData;
  const emphasis = useEdgeEmphasis(id);
  const color = edgeColor(tone, emphasis);
  const { base, shape } = arrowhead(points);
  const path = roundedPath([...points.slice(0, -1), base]);
  const opacity = emphasis === "dim" ? 0.12 : tone === "structure" ? 0.7 : 0.85;
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: emphasis === "focus" ? 2 : 1.25,
          strokeDasharray: tone === "structure" ? "5 4" : undefined,
          opacity,
          transition: "opacity 150ms",
        }}
      />
      {emphasis !== "dim" && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={emphasis === "focus" ? 3 : 2.25}
          strokeLinecap="round"
          className="kikx-edge-flow"
          style={{ opacity: emphasis === "focus" ? 1 : 0.7 }}
        />
      )}
      <path d={shape} fill={color} style={{ opacity, transition: "opacity 150ms" }} />
      {labelPosition && emphasis !== "dim" && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(${labelPosition.x}px, ${labelPosition.y}px)` }}
            className={cn(
              "pointer-events-none absolute rounded border bg-card px-1.5 text-[10px] leading-4 whitespace-nowrap",
              emphasis === "focus" ? "border-brand text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
