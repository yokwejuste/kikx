import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowNodeData {
  [key: string]: unknown;
  label: string;
  description: string;
  icon: LucideIcon;
  kind: "actor" | "process" | "data";
  handles: { target?: boolean; source?: boolean };
  active?: boolean;
}

function FlowNodeImpl({ data }: NodeProps) {
  const { label, description, icon: Icon, kind, handles, active } = data as FlowNodeData;

  return (
    <div
      className={cn(
        "w-56 rounded-xl border bg-card px-4 py-3 shadow-sm transition-all duration-300",
        kind === "data" && "border-dashed",
        active ? "border-primary shadow-md ring-2 ring-primary/30" : "border-border",
      )}
    >
      {handles.target && <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-300",
            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{description}</p>
      {handles.source && <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />}
    </div>
  );
}

export const FlowNode = memo(FlowNodeImpl);
