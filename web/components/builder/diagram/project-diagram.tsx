"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useColorMode } from "@/lib/theme/use-color-mode";
import { useTranslations } from "next-intl";
import { Download, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { DiagramIllustration } from "@/components/illustrations/illustrations";
import { DiagramNode } from "@/components/builder/diagram/diagram-node";
import { LaneNode } from "@/components/builder/diagram/lane-node";
import { RoutedEdge } from "@/components/builder/diagram/routed-edge";
import { DiagramLegend } from "@/components/builder/diagram/diagram-legend";
import { useArchitectureLayout } from "@/components/builder/diagram/use-architecture-layout";
import { useDiagramElements, useNeighbourhood } from "@/components/builder/diagram/use-diagram-elements";
import { NeighbourhoodContext } from "@/components/builder/diagram/emphasis";
import { buildArchitectureGraph } from "@/lib/architecture/graph";
import { downloadDrawio } from "@/lib/architecture/drawio";
import { useProject, type AddedComponent } from "@/lib/project/context";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";
import { Spinner } from "@/components/common/spinner";

const nodeTypes = { diagram: DiagramNode, lane: LaneNode };
const edgeTypes = { routed: RoutedEdge };

function FitWhenReady({ layoutKey }: { layoutKey: string }) {
  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  const fittedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!initialized || fittedKey.current === layoutKey) return;
    fittedKey.current = layoutKey;
    fitView({ padding: 0.06, duration: 0 });
  }, [initialized, fitView, layoutKey]);
  return null;
}

export function ProjectDiagram({ onOpen }: { onOpen?: (component: AddedComponent) => void }) {
  const colorMode = useColorMode();
  const t = useTranslations("diagram");
  const { details, components } = useProject();
  const graph = useMemo(() => buildArchitectureGraph(components, t), [components, t]);
  const { layout, failed } = useArchitectureLayout(graph);
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { nodes, edges } = useDiagramElements(layout);
  const neighbourhood = useNeighbourhood(layout, hovered);

  if (components.length === 0) {
    return (
      <EmptyState className="h-canvas gap-4">
        <DiagramIllustration className="h-28" />
        {t("empty")}
      </EmptyState>
    );
  }

  const layoutKey = layout
    ? `${layout.nodes.length}:${layout.edges.length}:${layout.lanes.map((l) => Math.round(l.width)).join(",")}:${expanded}`
    : "pending";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DiagramLegend />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <Minimize2 /> : <Maximize2 />}
            {expanded ? t("collapse") : t("expand")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!layout}
            onClick={() => layout && downloadDrawio(layout, `${details?.name || "kikx"}-architecture`)}
          >
            <Download />
            {t("export")}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card transition-[height]",
          expanded ? "h-canvas-expanded" : "h-canvas-tall",
        )}
      >
        {!layout && !failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            {t("arranging")}
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-destructive">
            {t("failed")}
          </div>
        )}
        {layout && (
          <NeighbourhoodContext.Provider value={neighbourhood}>
          <ReactFlowProvider>
            <ReactFlow
              key={layoutKey}
              className="kikx-flow"
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              colorMode={colorMode}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.1}
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
              <FitWhenReady layoutKey={layoutKey} />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls className="kikx-flow-panel" showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
          </NeighbourhoodContext.Provider>
        )}
      </div>
      <Hint>
        {t("hint")}
      </Hint>
    </div>
  );
}
