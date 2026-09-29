import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/components/flow/flow-node";
import { useNodeEmphasis } from "@/components/builder/diagram/emphasis";
import { NODE_HEIGHT, NODE_WIDTH } from "@/lib/architecture/layout";
import { cn } from "@/lib/utils";

export const DiagramNode = memo(function DiagramNode({ id, data }: NodeProps) {
  const { label, description, icon: Icon, kind } = data as FlowNodeData;
  const emphasis = useNodeEmphasis(id);
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
