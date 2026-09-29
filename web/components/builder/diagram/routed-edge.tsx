import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { edgeColor, type Emphasis } from "@/components/builder/diagram/emphasis";
import type { GraphEdge } from "@/lib/architecture/graph";
import type { Point } from "@/lib/architecture/layout";
import { cn } from "@/lib/utils";

interface RoutedEdgeData {
  [key: string]: unknown;
  points: Point[];
  label: string;
  labelPosition: Point | null;
  tone: GraphEdge["tone"];
  emphasis: Emphasis;
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

export function RoutedEdge({ id, data, markerEnd }: EdgeProps) {
  const { points, label, labelPosition, tone, emphasis } = data as RoutedEdgeData;
  return (
    <>
      <BaseEdge
        id={id}
        path={roundedPath(points)}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor(tone, emphasis),
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
