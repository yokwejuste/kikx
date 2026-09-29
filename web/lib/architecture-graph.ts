import { MarkerType, type Node, type Edge } from "@xyflow/react";
import { Boxes, Cloud, Cog, FileCode2, ListOrdered, Network, Package, ScrollText } from "lucide-react";
import { playbookPath, playsFromRecipe } from "@/lib/component-form-utils";
import type { AddedComponent } from "@/lib/project-context";
import type { FlowNodeData } from "@/components/flow/flow-node";

/** Lanes wrap into extra columns past this many nodes, so a 20-group inventory stays readable. */
const ROWS_PER_COLUMN = 8;
const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 110;
const LANE_GAP = 100;

const LANE_LABEL: Record<string, string> = {
  terraform: "Provision",
  inventory: "Inventory",
  ansible: "Configure",
  k8s: "Deploy",
  custom: "Custom",
};

const LANE_ORDER = ["terraform", "inventory", "ansible", "k8s", "custom"];

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

function relationEdge(id: string, source: string, target: string, label: string): Edge {
  return {
    id,
    source,
    target,
    label,
    animated: true,
    labelStyle: { fill: "var(--foreground)", fontSize: 12, fontWeight: 500 },
    labelBgStyle: { fill: "var(--card)" },
    labelBgPadding: [4, 2],
    style: { stroke: "var(--primary)", strokeWidth: 1.75 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--primary)", width: 18, height: 18 },
  };
}

export function buildArchitectureGraph(components: AddedComponent[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const laneOf = new Map<string, string>();

  // Positions are assigned at the end, once every lane's size is known.
  const addNode = (id: string, lane: string, data: FlowNodeData) => {
    laneOf.set(id, lane);
    nodes.push({ id, type: "flow", position: { x: 0, y: 0 }, data: { ...data, active: true }, draggable: true });
  };

  const inventoryGroupId: Record<string, string> = {};
  const k8sServiceIdByName: Record<string, string> = {};
  const k8sDeploymentIdByName: Record<string, string> = {};
  const ansiblePlaybooks: { id: string; hosts: string }[] = [];
  const groupVarsNodes: { id: string; group: string }[] = [];
  const roleIdByName: Record<string, string> = {};
  const playbookRoleAssignments: { id: string; roles: string[] }[] = [];
  const k8sServices: { id: string; appLabel: string }[] = [];
  const k8sIngresses: { id: string; wantsService: string }[] = [];
  const playbookIdByPath: Record<string, string> = {};
  const siteImports: { id: string; paths: string[] }[] = [];

  for (const component of components) {
    const { reference, name, fields, labels } = component.recipe;
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
          kind: "data",
          handles: { target: true, source: true },
        });
        inventoryGroupId[g.group] = idFor(g.group);

        for (const child of g.children ?? []) {
          if (!known.has(child)) continue;
          edges.push({
            id: `${idFor(g.group)}->${idFor(child)}`,
            source: idFor(g.group),
            target: idFor(child),
            label: "includes",
            labelStyle: { fill: "var(--muted-foreground)", fontSize: 12 },
            labelBgStyle: { fill: "var(--card)" },
            labelBgPadding: [4, 2],
            style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--muted-foreground)", width: 16, height: 16 },
          });
        }
      }
      continue;
    }

    if (reference === "ansible/group-vars") {
      addNode(component.id, lane, {
        label: `group_vars/${fields.group || name}`,
        description: "Ansible group vars",
        icon: FileCode2,
        kind: "data",
        handles: { target: true, source: true },
      });
      if (fields.group) {
        groupVarsNodes.push({ id: component.id, group: fields.group });
      }
      continue;
    }

    if (reference === "ansible/site") {
      addNode(component.id, lane, {
        label: `${name}.yml`,
        description: "Site playbook · entry point",
        icon: ListOrdered,
        kind: "process",
        handles: { target: true, source: true },
      });
      try {
        const imports = JSON.parse(fields.playbooks ?? "[]");
        if (Array.isArray(imports)) siteImports.push({ id: component.id, paths: imports.map((i) => i.path) });
      } catch {
        // an unparseable recipe simply draws no edges
      }
      continue;
    }

    if (reference === "ansible/playbook") {
      const plays = playsFromRecipe(component.recipe);
      const roleCount = new Set(plays.flatMap((p) => p.roles)).size;
      addNode(component.id, lane, {
        label: name,
        description: `Playbook · ${plays.length} play${plays.length === 1 ? "" : "s"} · ${roleCount} role${roleCount === 1 ? "" : "s"}`,
        icon: ScrollText,
        kind: "process",
        handles: { target: true, source: true },
      });
      playbookIdByPath[playbookPath(name, fields.folder)] = component.id;
      for (const play of plays) {
        if (play.hosts) ansiblePlaybooks.push({ id: component.id, hosts: play.hosts });
      }
      playbookRoleAssignments.push({ id: component.id, roles: plays.flatMap((p) => p.roles) });
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
      if (isRole) roleIdByName[name] = component.id;
      if (fields.hosts) ansiblePlaybooks.push({ id: component.id, hosts: fields.hosts });
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
      const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1);
      addNode(component.id, lane, {
        label: `${name} · ${kindLabel}`,
        description: fields.image ? `Image: ${fields.image}` : `Kubernetes ${kind}`,
        icon: Package,
        kind: "process",
        handles: { target: true, source: true },
      });
      if (kind === "deployment") k8sDeploymentIdByName[name] = component.id;
      if (kind === "service") {
        k8sServiceIdByName[name] = component.id;
        k8sServices.push({ id: component.id, appLabel: labels.app });
      }
      if (kind === "ingress") {
        k8sIngresses.push({ id: component.id, wantsService: fields.service || name });
      }
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

  const edgeIds = new Set<string>();
  const pushEdge = (edge: Edge) => {
    if (edgeIds.has(edge.id)) return;
    edgeIds.add(edge.id);
    edges.push(edge);
  };

  for (const playbook of ansiblePlaybooks) {
    const targets =
      playbook.hosts === "all" ? Object.values(inventoryGroupId) : [inventoryGroupId[playbook.hosts]].filter(Boolean);
    for (const groupId of targets) {
      pushEdge(relationEdge(`${groupId}->${playbook.id}`, groupId, playbook.id, "targets"));
    }
  }

  for (const assignment of playbookRoleAssignments) {
    for (const roleName of assignment.roles) {
      const roleId = roleIdByName[roleName];
      if (!roleId) continue;
      pushEdge(relationEdge(`${assignment.id}->${roleId}`, assignment.id, roleId, "includes role"));
    }
  }

  for (const site of siteImports) {
    for (const path of site.paths) {
      const playbookId = playbookIdByPath[path];
      if (!playbookId) continue;
      pushEdge(relationEdge(`${site.id}->${playbookId}`, site.id, playbookId, "imports"));
    }
  }

  for (const groupVars of groupVarsNodes) {
    const groupId = inventoryGroupId[groupVars.group];
    if (!groupId) continue;
    edges.push(relationEdge(`${groupId}->${groupVars.id}`, groupId, groupVars.id, "configures"));
  }

  for (const service of k8sServices) {
    if (!service.appLabel) continue;
    const deploymentId = k8sDeploymentIdByName[service.appLabel];
    if (!deploymentId) continue;
    edges.push(relationEdge(`${service.id}->${deploymentId}`, service.id, deploymentId, "selects"));
  }

  for (const ingress of k8sIngresses) {
    const serviceId = k8sServiceIdByName[ingress.wantsService];
    if (!serviceId) continue;
    edges.push(relationEdge(`${ingress.id}->${serviceId}`, ingress.id, serviceId, "routes to"));
  }

  const lanes: { id: string; label: string; x: number }[] = [];
  let laneX = 0;
  for (const lane of LANE_ORDER) {
    const members = nodes.filter((n) => laneOf.get(n.id) === lane);
    if (members.length === 0) continue;
    members.forEach((node, index) => {
      node.position = {
        x: laneX + Math.floor(index / ROWS_PER_COLUMN) * COLUMN_WIDTH,
        y: (index % ROWS_PER_COLUMN) * ROW_HEIGHT,
      };
    });
    lanes.push({ id: lane, label: LANE_LABEL[lane], x: laneX });
    laneX += Math.ceil(members.length / ROWS_PER_COLUMN) * COLUMN_WIDTH + LANE_GAP;
  }

  return { nodes, edges, lanes };
}
