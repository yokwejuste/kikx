import { Settings2, Boxes, Cloud, Cog, FileCode2, ListOrdered, Network, Package, Rocket, ScrollText } from "lucide-react";
import { groupVarsPath } from "@/lib/ansible/group-vars";
import { parseInventoryEntries } from "@/lib/ansible/inventory";
import { hostPatterns, playbookPath, playsFromRecipe, siteImportsFromRecipe } from "@/lib/ansible/playbook";
import type { Translate } from "@/lib/i18n/localized-error";
import type { AddedComponent } from "@/lib/project/context";
import { REFERENCES } from "@/lib/registry/references";
import type { FlowNodeData } from "@/components/flow/flow-node";

export const LANES = ["provision", "inventory", "playbooks", "roles", "deploy", "custom"] as const;

export type LaneId = (typeof LANES)[number];

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
  tone: "structure" | "relation";
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  laneLabels: Record<LaneId, string>;
}

function laneFor(component: AddedComponent): LaneId {
  const { reference } = component.recipe;
  if ([REFERENCES.inventory, REFERENCES.groupvars, REFERENCES.ansiblecfg].includes(reference as never)) {
    return "inventory";
  }
  if (reference === REFERENCES.playbook || reference === REFERENCES.site || reference === REFERENCES.ansible) {
    return "playbooks";
  }
  if (reference.startsWith("ansible/")) return "roles";
  if (reference.startsWith("terraform/")) return "provision";
  if (reference.startsWith("k8s/")) return "deploy";
  return "custom";
}

export function buildArchitectureGraph(components: AddedComponent[], t: Translate): ArchitectureGraph {
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
  const groupMembers = new Map<string, string[]>();
  const inventories: { fileName: string; groups: string[]; children: Set<string> }[] = [];
  const provisioners: { id: string; name: string }[] = [];
  const configs: { id: string; inventory: string }[] = [];

  for (const component of components) {
    const { reference, name, fields, labels } = component.recipe;
    const lane = laneFor(component);

    if (reference === REFERENCES.inventory) {
      const entries = parseInventoryEntries(fields.hosts);
      const known = new Set(entries.map((e) => e.group));
      inventories.push({
        fileName: component.files[0]?.fileName ?? "",
        groups: entries.map((e) => e.group),
        children: new Set(entries.flatMap((e) => e.children ?? [])),
      });
      for (const entry of entries) groupMembers.set(entry.group, (entry.members ?? []).map((m) => m.name));
      for (const entry of entries) {
        const id = `${component.id}:${entry.group}`;
        const parts: string[] = [];
        if (entry.members?.length) parts.push(t("nodes.hosts", { count: entry.members.length }));
        if (entry.children?.length) parts.push(t("nodes.children", { count: entry.children.length }));
        if (entry.vars && Object.keys(entry.vars).length) parts.push(t("nodes.vars", { count: Object.keys(entry.vars).length }));
        addNode(id, lane, {
          label: entry.group,
          description: parts.join(" · ") || t("nodes.emptyGroup"),
          icon: entry.children?.length ? Network : Boxes,
          kind: "data",
        });
        groupNodeId.set(entry.group, id);
      }
      for (const entry of entries) {
        for (const child of entry.children ?? []) {
          if (!known.has(child)) continue;
          childGroups.add(child);
          addEdge(`${component.id}:${entry.group}`, `${component.id}:${child}`, t("edges.includes"), "structure");
        }
      }
      continue;
    }

    if (reference === REFERENCES.groupvars) {
      const group = fields.group || name;
      addNode(component.id, lane, {
        label: groupVarsPath(group, fields.layout),
        description: fields.yaml ? t("nodes.groupVarsYaml") : t("nodes.groupVars"),
        icon: FileCode2,
        kind: "data",
      });
      groupVars.push({ id: component.id, group });
      continue;
    }

    if (reference === REFERENCES.site) {
      addNode(component.id, lane, { label: `${name}.yml`, description: t("nodes.site"), icon: ListOrdered, kind: "process" });
      siteImports.push({ id: component.id, paths: siteImportsFromRecipe(component.recipe).map((i) => i.path) });
      continue;
    }

    if (reference === REFERENCES.playbook) {
      const plays = playsFromRecipe(component.recipe);
      const roles = Array.from(new Set(plays.flatMap((p) => p.roles)));
      const path = playbookPath(name, fields.folder);
      addNode(component.id, lane, {
        label: path,
        description: t("nodes.plays", { plays: plays.length, roles: roles.length }),
        icon: ScrollText,
        kind: "process",
      });
      playbookIdByPath.set(path, component.id);
      for (const play of plays) if (play.hosts) hostTargets.push({ id: component.id, hosts: play.hosts });
      roleAssignments.push({ id: component.id, roles });
      continue;
    }

    if (reference === REFERENCES.ansible) {
      addNode(component.id, lane, { label: name, description: t("nodes.bootstrap"), icon: Rocket, kind: "process" });
      if (fields.hosts) hostTargets.push({ id: component.id, hosts: fields.hosts });
      continue;
    }

    if (reference === REFERENCES.ansiblecfg) {
      addNode(component.id, lane, {
        label: "ansible.cfg",
        description: t("nodes.rolesPath", {
          path:
            fields.roles_path ||
            /^roles_path\s*=\s*(\S+)/m.exec(component.files[0]?.content ?? "")?.[1] ||
            t("nodes.unset"),
        }),
        icon: Settings2,
        kind: "data",
      });
      configs.push({ id: component.id, inventory: fields.inventory ?? "" });
      continue;
    }

    if (lane === "roles") {
      addNode(component.id, lane, {
        label: `roles/${name}`,
        description: t("nodes.role", { count: component.files.length }),
        icon: Cog,
        kind: "process",
      });
      roleIdByName.set(name, component.id);
      continue;
    }

    if (lane === "provision") {
      addNode(component.id, lane, {
        label: name,
        description: [fields.region, fields.size].filter(Boolean).join(" · ") || t("nodes.terraform"),
        icon: Cloud,
        kind: "process",
      });
      provisioners.push({ id: component.id, name });
      continue;
    }

    if (lane === "deploy") {
      const kind = reference.split("/")[1] ?? "resource";
      addNode(component.id, lane, {
        label: `${name} · ${kind.charAt(0).toUpperCase()}${kind.slice(1)}`,
        description: fields.image ? t("nodes.image", { image: fields.image }) : t("nodes.k8s", { kind }),
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

  const rootGroups = Array.from(groupNodeId.entries())
    .filter(([group]) => !childGroups.has(group))
    .map(([, id]) => id);

  for (const { id, hosts } of hostTargets) {
    for (const pattern of hostPatterns(hosts)) {
      const targets = pattern === "all" && !groupNodeId.has("all") ? rootGroups : [groupNodeId.get(pattern)];
      for (const groupId of targets) if (groupId) addEdge(groupId, id, t("edges.targets"));
    }
  }
  for (const { id, group } of groupVars) {
    const groupId = groupNodeId.get(group);
    if (groupId) addEdge(groupId, id, t("edges.configures"), "structure");
  }
  for (const { id, paths } of siteImports) {
    for (const path of paths) {
      const playbookId = playbookIdByPath.get(path);
      if (playbookId) addEdge(id, playbookId, t("edges.imports"));
    }
  }
  for (const { id, roles } of roleAssignments) {
    for (const role of roles) {
      const roleId = roleIdByName.get(role);
      if (roleId) addEdge(id, roleId, t("edges.runs"));
    }
  }
  for (const { id, backend } of ingresses) {
    const serviceId = serviceIdByName.get(backend);
    if (serviceId) addEdge(id, serviceId, t("edges.routesTo"));
  }
  for (const { id, selector } of services) {
    const deploymentId = deploymentIdByApp.get(selector);
    if (deploymentId) addEdge(id, deploymentId, t("edges.selects"));
  }

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const groups = Array.from(groupNodeId.keys());
  for (const { id, name } of provisioners) {
    const key = normalize(name);
    const byName = groups.filter((group) => normalize(group) === key);
    const byHosts = groups.filter((group) =>
      (groupMembers.get(group) ?? []).some((host) => host.toLowerCase().startsWith(`${name.toLowerCase()}-`)),
    );
    const word = new RegExp(`(^|_)${key}(_|$)`);
    const byWord = groups.filter((group) => word.test(normalize(group)));
    const matches = [byName, byHosts, byWord].find((candidates) => candidates.length > 0);
    const targets = matches ? matches.map((group) => groupNodeId.get(group)) : rootGroups;
    for (const groupId of targets) if (groupId) addEdge(id, groupId, t("edges.provisions"));
  }
  for (const { id, inventory } of configs) {
    const wanted = inventory.split("/").pop();
    const loaded = wanted
      ? inventories.filter((candidate) => candidate.fileName.split("/").pop() === wanted)
      : inventories.length === 1
        ? inventories
        : [];
    for (const candidate of loaded) {
      for (const group of candidate.groups) {
        if (candidate.children.has(group)) continue;
        const groupId = groupNodeId.get(group);
        if (groupId) addEdge(id, groupId, t("edges.loads"), "structure");
      }
    }
  }

  const laneLabels = Object.fromEntries(LANES.map((lane) => [lane, t(`lanes.${lane}`)])) as Record<LaneId, string>;

  return { nodes, edges, laneLabels };
}
