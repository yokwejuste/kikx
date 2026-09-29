import { Boxes, Cloud, Cog, FileCode2, ListOrdered, Network, Package, Rocket, ScrollText } from "lucide-react";
import { groupVarsPath } from "@/lib/ansible/group-vars";
import { parseInventoryEntries } from "@/lib/ansible/inventory";
import { hostPatterns, playbookPath, playsFromRecipe, siteImportsFromRecipe } from "@/lib/ansible/playbook";
import { pluralize } from "@/lib/format";
import type { AddedComponent } from "@/lib/project/context";
import { REFERENCES } from "@/lib/registry/references";
import type { FlowNodeData } from "@/components/flow/flow-node";

/** Swimlanes, left to right in the order things happen. */
export const LANES = [
  { id: "provision", label: "Provision" },
  { id: "inventory", label: "Inventory" },
  { id: "playbooks", label: "Playbooks" },
  { id: "roles", label: "Roles" },
  { id: "deploy", label: "Deploy" },
  { id: "custom", label: "Custom" },
] as const;

export type LaneId = (typeof LANES)[number]["id"];

export interface GraphNode {
  id: string;
  lane: LaneId;
  data: FlowNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  /** "structure" = how the inventory is nested; "relation" = how components use each other. */
  tone: "structure" | "relation";
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function laneFor(component: AddedComponent): LaneId {
  const { reference } = component.recipe;
  if (reference === REFERENCES.inventory || reference === REFERENCES.groupvars) return "inventory";
  if (reference === REFERENCES.playbook || reference === REFERENCES.site || reference === REFERENCES.ansible) {
    return "playbooks";
  }
  if (reference.startsWith("ansible/")) return "roles";
  if (reference.startsWith("terraform/")) return "provision";
  if (reference.startsWith("k8s/")) return "deploy";
  return "custom";
}

/**
 * The project's topology: one node per component (one per group for inventories) and an edge
 * for every real relationship between them. Layout is a separate step (layout.ts).
 */
export function buildArchitectureGraph(components: AddedComponent[]): ArchitectureGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeIds = new Set<string>();
  const addNode = (id: string, lane: LaneId, data: Pick<FlowNodeData, "label" | "description" | "icon" | "kind">) =>
    nodes.push({ id, lane, data: { ...data, handles: { target: true, source: true }, active: true } });
  const addEdge = (source: string, target: string, label: string, tone: GraphEdge["tone"] = "relation") => {
    const id = `${source}->${target}`;
    if (source === target || edgeIds.has(id)) return;
    edgeIds.add(id);
    edges.push({ id, source, target, label, tone });
  };

  const groupNodeId = new Map<string, string>();
  const childGroups = new Set<string>();
  const hostTargets: { id: string; hosts: string }[] = [];
  const roleAssignments: { id: string; roles: string[] }[] = [];
  const groupVars: { id: string; group: string }[] = [];
  const siteImports: { id: string; paths: string[] }[] = [];
  const roleIdByName = new Map<string, string>();
  const playbookIdByPath = new Map<string, string>();
  const deploymentIdByApp = new Map<string, string>();
  const serviceIdByName = new Map<string, string>();
  const services: { id: string; selector: string }[] = [];
  const ingresses: { id: string; backend: string }[] = [];

  for (const component of components) {
    const { reference, name, fields, labels } = component.recipe;
    const lane = laneFor(component);

    if (reference === REFERENCES.inventory) {
      const entries = parseInventoryEntries(fields.hosts);
      const known = new Set(entries.map((e) => e.group));
      for (const entry of entries) {
        const id = `${component.id}:${entry.group}`;
        const parts: string[] = [];
        if (entry.members?.length) parts.push(pluralize(entry.members.length, "host"));
        if (entry.children?.length) parts.push(pluralize(entry.children.length, "child group"));
        if (entry.vars && Object.keys(entry.vars).length) parts.push(`${Object.keys(entry.vars).length} var(s)`);
        addNode(id, lane, {
          label: entry.group,
          description: parts.join(" · ") || "empty group",
          icon: entry.children?.length ? Network : Boxes,
          kind: "data",
        });
        groupNodeId.set(entry.group, id);
      }
      for (const entry of entries) {
        for (const child of entry.children ?? []) {
          if (!known.has(child)) continue;
          childGroups.add(child);
          addEdge(`${component.id}:${entry.group}`, `${component.id}:${child}`, "includes", "structure");
        }
      }
      continue;
    }

    if (reference === REFERENCES.groupvars) {
      const group = fields.group || name;
      addNode(component.id, lane, {
        label: groupVarsPath(group, fields.layout),
        description: fields.yaml ? "Group vars · YAML" : "Group vars",
        icon: FileCode2,
        kind: "data",
      });
      groupVars.push({ id: component.id, group });
      continue;
    }

    if (reference === REFERENCES.site) {
      addNode(component.id, lane, { label: `${name}.yml`, description: "Site playbook · entry point", icon: ListOrdered, kind: "process" });
      siteImports.push({ id: component.id, paths: siteImportsFromRecipe(component.recipe).map((i) => i.path) });
      continue;
    }

    if (reference === REFERENCES.playbook) {
      const plays = playsFromRecipe(component.recipe);
      const roles = Array.from(new Set(plays.flatMap((p) => p.roles)));
      const path = playbookPath(name, fields.folder);
      addNode(component.id, lane, {
        label: path,
        description: `${pluralize(plays.length, "play")} · ${pluralize(roles.length, "role")}`,
        icon: ScrollText,
        kind: "process",
      });
      playbookIdByPath.set(path, component.id);
      for (const play of plays) if (play.hosts) hostTargets.push({ id: component.id, hosts: play.hosts });
      roleAssignments.push({ id: component.id, roles });
      continue;
    }

    if (reference === REFERENCES.ansible) {
      addNode(component.id, lane, { label: name, description: "K8s bootstrap playbook", icon: Rocket, kind: "process" });
      if (fields.hosts) hostTargets.push({ id: component.id, hosts: fields.hosts });
      continue;
    }

    if (lane === "roles") {
      addNode(component.id, lane, {
        label: `roles/${name}`,
        description: `Ansible role · ${component.files.length} files`,
        icon: Cog,
        kind: "process",
      });
      roleIdByName.set(name, component.id);
      continue;
    }

    if (lane === "provision") {
      addNode(component.id, lane, {
        label: name,
        description: [fields.region, fields.size].filter(Boolean).join(" · ") || "Terraform resource",
        icon: Cloud,
        kind: "process",
      });
      continue;
    }

    if (lane === "deploy") {
      const kind = reference.split("/")[1] ?? "resource";
      addNode(component.id, lane, {
        label: `${name} · ${kind.charAt(0).toUpperCase()}${kind.slice(1)}`,
        description: fields.image ? `Image: ${fields.image}` : `Kubernetes ${kind}`,
        icon: Package,
        kind: "process",
      });
      if (kind === "deployment") deploymentIdByApp.set(labels.app ?? name, component.id);
      if (kind === "service") {
        serviceIdByName.set(name, component.id);
        services.push({ id: component.id, selector: labels.app ?? name });
      }
      if (kind === "ingress") ingresses.push({ id: component.id, backend: fields.service || name });
      continue;
    }

    addNode(component.id, lane, { label: name, description: reference, icon: FileCode2, kind: "process" });
  }

  // "all" means every host: point at the top-level groups rather than fanning out to each one.
  const rootGroups = Array.from(groupNodeId.entries())
    .filter(([group]) => !childGroups.has(group))
    .map(([, id]) => id);

  for (const { id, hosts } of hostTargets) {
    for (const pattern of hostPatterns(hosts)) {
      const targets = pattern === "all" && !groupNodeId.has("all") ? rootGroups : [groupNodeId.get(pattern)];
      for (const groupId of targets) if (groupId) addEdge(groupId, id, "targets");
    }
  }
  for (const { id, group } of groupVars) {
    const groupId = groupNodeId.get(group);
    if (groupId) addEdge(groupId, id, "configures", "structure");
  }
  for (const { id, paths } of siteImports) {
    for (const path of paths) {
      const playbookId = playbookIdByPath.get(path);
      if (playbookId) addEdge(id, playbookId, "imports");
    }
  }
  for (const { id, roles } of roleAssignments) {
    for (const role of roles) {
      const roleId = roleIdByName.get(role);
      if (roleId) addEdge(id, roleId, "runs");
    }
  }
  for (const { id, backend } of ingresses) {
    const serviceId = serviceIdByName.get(backend);
    if (serviceId) addEdge(id, serviceId, "routes to");
  }
  for (const { id, selector } of services) {
    const deploymentId = deploymentIdByApp.get(selector);
    if (deploymentId) addEdge(id, deploymentId, "selects");
  }

  return { nodes, edges };
}
