import type { Node, Edge } from "@xyflow/react";
import { Boxes, Cloud, Cog, FileCode2, Network, Package } from "lucide-react";
import type { AddedComponent } from "@/lib/project-context";
import type { FlowNodeData } from "@/components/flow/flow-node";

const LANE_X: Record<string, number> = {
  inventory: 0,
  ansible: 340,
  terraform: 680,
  k8s: 1020,
  custom: 1360,
};

const LANE_ORDER = ["inventory", "ansible", "terraform", "k8s", "custom"];

function laneFor(reference: string): string {
  if (reference === "ansible/inventory") return "inventory";
  if (reference.startsWith("ansible/")) return "ansible";
  if (reference.startsWith("terraform/")) return "terraform";
  if (reference.startsWith("k8s/")) return "k8s";
  return "custom";
}

interface InventoryGroup {
  group: string;
  members?: { name: string }[];
  children?: string[];
  vars?: Record<string, string>;
}

function inventoryGroups(fieldsHosts: string | undefined): InventoryGroup[] {
  if (!fieldsHosts) return [];
  try {
    const parsed = JSON.parse(fieldsHosts);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildArchitectureGraph(components: AddedComponent[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const laneY: Record<string, number> = {};
  const nextY = (lane: string) => {
    const y = laneY[lane] ?? 0;
    laneY[lane] = y + 110;
    return y;
  };

  const addNode = (id: string, lane: string, data: FlowNodeData) => {
    nodes.push({
      id,
      type: "flow",
      position: { x: LANE_X[lane] ?? LANE_X.custom, y: nextY(lane) },
      data: { ...data, active: true },
      draggable: true,
    });
  };

  for (const component of components) {
    const { reference, name, fields } = component.recipe;
    const lane = laneFor(reference);

    if (reference === "ansible/inventory") {
      const groups = inventoryGroups(fields.hosts);
      const idFor = (groupName: string) => `${component.id}:${groupName}`;
      const known = new Set(groups.map((g) => g.group));

      for (const g of groups) {
        const parts: string[] = [];
        if (g.members?.length) parts.push(`${g.members.length} host${g.members.length > 1 ? "s" : ""}`);
        if (g.children?.length) parts.push(`children: ${g.children.join(", ")}`);
        if (g.vars && Object.keys(g.vars).length) parts.push(`${Object.keys(g.vars).length} var(s)`);

        addNode(idFor(g.group), lane, {
          label: g.group,
          description: parts.join(" · ") || "empty group",
          icon: g.children?.length ? Network : Boxes,
          kind: "process",
          handles: { target: true, source: true },
        });

        for (const child of g.children ?? []) {
          if (!known.has(child)) continue;
          edges.push({
            id: `${idFor(g.group)}->${idFor(child)}`,
            source: idFor(g.group),
            target: idFor(child),
            style: { stroke: "var(--border)", strokeWidth: 1.5 },
          });
        }
      }
      continue;
    }

    if (lane === "ansible") {
      const isRole = component.files.length > 1;
      addNode(component.id, lane, {
        label: name,
        description: isRole ? `Ansible role · ${component.files.length} files` : "Ansible playbook",
        icon: Cog,
        kind: "process",
        handles: { target: true, source: true },
      });
      continue;
    }

    if (lane === "terraform") {
      const bits = [fields.region, fields.size].filter(Boolean).join(" · ");
      addNode(component.id, lane, {
        label: name,
        description: bits || "Terraform resource",
        icon: Cloud,
        kind: "process",
        handles: { target: true, source: true },
      });
      continue;
    }

    if (lane === "k8s") {
      const kind = reference.split("/")[1] ?? "resource";
      addNode(component.id, lane, {
        label: name,
        description: `Kubernetes ${kind}${fields.image ? ` · ${fields.image}` : ""}`,
        icon: Package,
        kind: "process",
        handles: { target: true, source: true },
      });
      continue;
    }

    addNode(component.id, lane, {
      label: name,
      description: reference,
      icon: FileCode2,
      kind: "process",
      handles: { target: true, source: true },
    });
  }

  return { nodes, edges, lanes: LANE_ORDER };
}
