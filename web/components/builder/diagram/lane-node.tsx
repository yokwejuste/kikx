import type { NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface LaneNodeData {
  [key: string]: unknown;
  label: string;
  width: number;
  height: number;
  shaded: boolean;
}

export function LaneNode({ data }: NodeProps) {
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
