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
import { useTranslations } from "next-intl";
import { Terminal, Globe, Cog, Layers, FileJson2, FileCode2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowNode, type FlowNodeData } from "@/components/flow/flow-node";

const nodeTypes = { flow: FlowNode };

type NodeDef = {
  id: string;
  x: number;
  y: number;
  label?: string;
  description?: string;
  data: Omit<FlowNodeData, "label" | "description">;
};

const NODE_DEFS: NodeDef[] = [
  {
    id: "terminal",
    x: 0,
    y: 0,
    description: "kikx init / kikx add …",
    data: {
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
      icon: Globe,
      kind: "actor",
      handles: { source: true },
    },
  },
  {
    id: "cli",
    x: 300,
    y: 0,
    label: "kikx CLI",
    data: {
      icon: Terminal,
      kind: "process",
      handles: { target: true, source: true },
    },
  },
  {
    id: "backend",
    x: 300,
    y: 200,
    label: "kikx-backend",
    data: {
      icon: Globe,
      kind: "process",
      handles: { target: true, source: true },
    },
  },
  {
    id: "core",
    x: 620,
    y: 100,
    label: "kikx-core",
    data: {
      icon: Cog,
      kind: "process",
      handles: { target: true, source: true },
    },
  },
  {
    id: "config",
    x: 940,
    y: 0,
    label: "kikx.toml",
    data: {
      icon: FileJson2,
      kind: "data",
      handles: { target: true },
    },
  },
  {
    id: "manifests",
    x: 940,
    y: 200,
    label: "k8s/*.yaml",
    data: {
      icon: FileCode2,
      kind: "data",
      handles: { target: true },
    },
  },
];

type EdgeDef = { id: string; source: string; target: string; label?: string };

const EDGE_DEFS: EdgeDef[] = [
  { id: "terminal-cli", source: "terminal", target: "cli" },
  { id: "browser-backend", source: "browser", target: "backend", label: "fetch /api/*" },
  { id: "cli-core", source: "cli", target: "core", label: "ops::*" },
  { id: "backend-core", source: "backend", target: "core", label: "ops::*" },
  { id: "core-config", source: "core", target: "config" },
  { id: "core-manifests", source: "core", target: "manifests" },
];

const PATHS = {
  cli: ["terminal-cli", "cli-core", "core-config", "core-manifests"],
  dashboard: ["browser-backend", "backend-core", "core-config", "core-manifests"],
} as const;

type PathKind = keyof typeof PATHS;

export function DataFlow() {
  const t = useTranslations("flow");
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
        data: {
          ...n.data,
          label: n.label ?? t(`nodes.${n.id}.label`),
          description: n.description ?? t(`nodes.${n.id}.description`),
          active: activeNodeIds.has(n.id),
        },
        draggable: true,
      })),
    [activeNodeIds, t],
  );

  const computedEdges: Edge[] = useMemo(
    () =>
      EDGE_DEFS.map((e) => {
        const active = activeEdgeIds.has(e.id);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label ?? t(`edges.${e.id}`),
          animated: active,
          labelStyle: { fill: "var(--muted-foreground)", fontSize: 11 },
          labelBgStyle: { fill: "var(--card)" },
          style: {
            stroke: active ? "var(--brand)" : "var(--border)",
            strokeWidth: active ? 2 : 1.5,
          },
        };
      }),
    [activeEdgeIds, t],
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
          <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("body")}
          </p>
        </div>
        <Tabs value={selected} onValueChange={(v) => setSelected(v as PathKind)}>
          <TabsList>
            <TabsTrigger value="cli">{t("tabs.cli")}</TabsTrigger>
            <TabsTrigger value="dashboard">{t("tabs.dashboard")}</TabsTrigger>
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
          <Layers className="size-3.5" /> {t("legend.solid")}
        </span>
        <span className="flex items-center gap-1.5">
          <FileJson2 className="size-3.5" /> {t("legend.dashed")}
        </span>
      </div>
    </div>
  );
}
