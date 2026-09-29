"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { FlowNode } from "@/components/flow/flow-node";
import { buildArchitectureGraph } from "@/lib/architecture-graph";
import { useProject, type AddedComponent } from "@/lib/project-context";

function LaneHeader({ data }: { data: { label: string } }) {
  return (
    <div className="w-56 border-b-2 border-muted-foreground/30 pb-1.5 text-sm font-semibold uppercase tracking-wide text-foreground">
      {data.label}
    </div>
  );
}

const nodeTypes = { flow: FlowNode, lane: LaneHeader };

export function ProjectDiagram({ onOpen }: { onOpen?: (component: AddedComponent) => void }) {
  const { resolvedTheme } = useTheme();
  const { components } = useProject();

  const { nodes: graphNodes, edges: graphEdges, lanes } = useMemo(() => buildArchitectureGraph(components), [components]);

  const computedNodes: Node[] = useMemo(
    () => [
      ...lanes.map((lane) => ({
        id: `lane:${lane.id}`,
        type: "lane",
        position: { x: lane.x, y: -60 },
        data: { label: lane.label },
        draggable: false,
        selectable: false,
        connectable: false,
      })),
      ...graphNodes,
    ],
    [lanes, graphNodes],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  useEffect(() => {
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);

  useEffect(() => {
    setEdges(graphEdges);
  }, [graphEdges, setEdges]);

  if (components.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add a component to see the architecture start forming.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[560px] overflow-hidden rounded-xl border bg-card">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            elementsSelectable={false}
            onNodeClick={(_, node) => {
              const owner = components.find((c) => node.id === c.id || node.id.startsWith(`${c.id}:`));
              if (owner) onOpen?.(owner);
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              position="top-right"
              nodeColor={(node) => (node.type === "lane" ? "transparent" : "var(--primary)")}
              nodeStrokeWidth={0}
              maskColor="color-mix(in srgb, var(--card) 70%, transparent)"
              className="!bg-card"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <p className="text-xs text-muted-foreground">
        Click a node to edit it. Dashed border = data (inventory groups, vars). Arrows = a real relationship kikx found
        between your components — a play targeting a group, a site importing a playbook, a service selecting a
        deployment — not just layout.
      </p>
    </div>
  );
}
