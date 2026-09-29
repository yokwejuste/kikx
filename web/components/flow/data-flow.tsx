"use client";

import { useEffect, useMemo, useState } from "react";
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
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { Terminal, Globe, Cog, Layers, FileJson2, FileCode2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowNode, type FlowNodeData } from "@/components/flow/flow-node";

const nodeTypes = { flow: FlowNode };

type NodeDef = { id: string; x: number; y: number; data: FlowNodeData };

const NODE_DEFS: NodeDef[] = [
  {
    id: "terminal",
    x: 0,
    y: 0,
    data: {
      label: "Terminal",
      description: "kikx init / kikx add …",
      icon: Terminal,
      kind: "actor",
      handles: { source: true },
    },
  },
  {
    id: "browser",
    x: 0,
    y: 200,
    data: {
      label: "Browser",
      description: "Dashboard form submit",
      icon: Globe,
      kind: "actor",
      handles: { source: true },
    },
  },
  {
    id: "cli",
    x: 300,
    y: 0,
    data: {
      label: "kikx CLI",
      description: "Parses flags, calls ops directly",
      icon: Terminal,
      kind: "process",
      handles: { target: true, source: true },
    },
  },
  {
    id: "backend",
    x: 300,
    y: 200,
    data: {
      label: "kikx-backend",
      description: "HTTP API, same ops underneath",
      icon: Globe,
      kind: "process",
      handles: { target: true, source: true },
    },
  },
  {
    id: "core",
    x: 620,
    y: 100,
    data: {
      label: "kikx-core",
      description: "Shared engine: config, templates, ops",
      icon: Cog,
      kind: "process",
      handles: { target: true, source: true },
    },
  },
  {
    id: "config",
    x: 940,
    y: 0,
    data: {
      label: "kikx.toml",
      description: "Project name, namespace, output dir",
      icon: FileJson2,
      kind: "data",
      handles: { target: true },
    },
  },
  {
    id: "manifests",
    x: 940,
    y: 200,
    data: {
      label: "k8s/*.yaml",
      description: "Rendered, vendored manifests",
      icon: FileCode2,
      kind: "data",
      handles: { target: true },
    },
  },
];

type EdgeDef = { id: string; source: string; target: string; label: string };

const EDGE_DEFS: EdgeDef[] = [
  { id: "terminal-cli", source: "terminal", target: "cli", label: "invoke" },
  { id: "browser-backend", source: "browser", target: "backend", label: "fetch /api/*" },
  { id: "cli-core", source: "cli", target: "core", label: "ops::*" },
  { id: "backend-core", source: "backend", target: "core", label: "ops::*" },
  { id: "core-config", source: "core", target: "config", label: "write" },
  { id: "core-manifests", source: "core", target: "manifests", label: "render + write" },
];

const PATHS = {
  cli: ["terminal-cli", "cli-core", "core-config", "core-manifests"],
  dashboard: ["browser-backend", "backend-core", "core-config", "core-manifests"],
} as const;

type PathKind = keyof typeof PATHS;

export function DataFlow() {
  const { resolvedTheme } = useTheme();
  const [selected, setSelected] = useState<PathKind>("cli");

  const activeEdgeIds = useMemo(() => new Set<string>(PATHS[selected]), [selected]);

  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edgeId of activeEdgeIds) {
      const edge = EDGE_DEFS.find((e) => e.id === edgeId)!;
      ids.add(edge.source);
      ids.add(edge.target);
    }
    return ids;
  }, [activeEdgeIds]);

  const computedNodes: Node[] = useMemo(
    () =>
      NODE_DEFS.map((n) => ({
        id: n.id,
        type: "flow",
        position: { x: n.x, y: n.y },
        data: { ...n.data, active: activeNodeIds.has(n.id) },
        draggable: true,
      })),
    [activeNodeIds],
  );

  const computedEdges: Edge[] = useMemo(
    () =>
      EDGE_DEFS.map((e) => {
        const active = activeEdgeIds.has(e.id);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: active,
          labelStyle: { fill: "var(--muted-foreground)", fontSize: 11 },
          labelBgStyle: { fill: "var(--card)" },
          style: {
            stroke: active ? "var(--primary)" : "var(--border)",
            strokeWidth: active ? 2 : 1.5,
          },
        };
      }),
    [activeEdgeIds],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  useEffect(() => {
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);

  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Data flow</h1>
          <p className="text-sm text-muted-foreground">
            Pick how you&apos;d drive kikx — the path it actually takes lights up.
          </p>
        </div>
        <Tabs value={selected} onValueChange={(v) => setSelected(v as PathKind)}>
          <TabsList>
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[560px] overflow-hidden rounded-xl border bg-card">
        <ReactFlowProvider>
          <ReactFlow
            className="kikx-flow"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="kikx-flow-panel" showInteractive={false} />
            <MiniMap className="kikx-flow-panel" pannable zoomable nodeColor="var(--muted-foreground)" nodeStrokeWidth={0} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Layers className="size-3.5" /> solid border = actor / process
        </span>
        <span className="flex items-center gap-1.5">
          <FileJson2 className="size-3.5" /> dashed border = data on disk
        </span>
      </div>
    </div>
  );
}
