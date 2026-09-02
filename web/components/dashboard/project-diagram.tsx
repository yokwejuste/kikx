"use client";

import { useMemo } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, BackgroundVariant } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { FlowNode } from "@/components/flow/flow-node";
import { buildArchitectureGraph } from "@/lib/architecture-graph";
import { useProject } from "@/lib/project-context";

const nodeTypes = { flow: FlowNode };

export function ProjectDiagram() {
  const { resolvedTheme } = useTheme();
  const { components } = useProject();

  const { nodes, edges } = useMemo(() => buildArchitectureGraph(components), [components]);

  if (components.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add a component to see the architecture start forming.
      </div>
    );
  }

  return (
    <div className="h-[560px] overflow-hidden rounded-xl border bg-card">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
