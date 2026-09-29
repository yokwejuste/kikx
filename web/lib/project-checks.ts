import type { AddedComponent } from "@/lib/project-context";
import { parseInventoryEntries, type InventoryGroupEntry } from "@/lib/inventory-utils";
import { extractAvailableRoleNames, playbookPath, playsFromRecipe } from "@/lib/component-form-utils";

export type IssueSeverity = "error" | "warning" | "info";

export interface ProjectIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  detail?: string;
  /** Components the issue is about — "Fix" opens the first one. */
  componentIds: string[];
  /** A one-click fix the Checks view can offer. */
  action?: { type: "scaffold-roles"; roles: string[] };
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };

function parseJsonRecord(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Top-level keys of a group_vars file, from either the key/value JSON or raw YAML. */
function groupVarsKeys(component: AddedComponent): Map<string, string | null> {
  const keys = new Map<string, string | null>();
  const { fields } = component.recipe;
  if (fields.yaml) {
    for (const line of fields.yaml.split("\n")) {
      const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (match) keys.set(match[1], match[2] ? match[2].replace(/^["']|["']$/g, "") : null);
    }
  } else {
    for (const [k, v] of Object.entries(parseJsonRecord(fields.vars))) keys.set(k, String(v));
  }
  return keys;
}

interface InventoryModel {
  component: AddedComponent;
  entries: InventoryGroupEntry[];
  groups: Set<string>;
  /** child group → its parent groups */
  parents: Map<string, string[]>;
}

function inventoryModel(component: AddedComponent): InventoryModel {
  const entries = parseInventoryEntries(component.recipe.fields.hosts);
  const groups = new Set<string>();
  const parents = new Map<string, string[]>();
  for (const entry of entries) {
    groups.add(entry.group);
    for (const child of entry.children ?? []) {
      groups.add(child);
      parents.set(child, [...(parents.get(child) ?? []), entry.group]);
    }
  }
  return { component, entries, groups, parents };
}

function ancestors(group: string, parents: Map<string, string[]>): string[] {
  const seen = new Set<string>();
  const stack = [group];
  while (stack.length) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(parents.get(current) ?? []));
  }
  return Array.from(seen);
}

function findCycle(entries: InventoryGroupEntry[]): string[] | null {
  const children = new Map(entries.map((e) => [e.group, e.children ?? []]));
  const state = new Map<string, "visiting" | "done">();
  const path: string[] = [];
  const visit = (group: string): string[] | null => {
    if (state.get(group) === "done") return null;
    if (state.get(group) === "visiting") return [...path.slice(path.indexOf(group)), group];
    state.set(group, "visiting");
    path.push(group);
    for (const child of children.get(group) ?? []) {
      const cycle = visit(child);
      if (cycle) return cycle;
    }
    path.pop();
    state.set(group, "done");
    return null;
  };
  for (const entry of entries) {
    const cycle = visit(entry.group);
    if (cycle) return cycle;
  }
  return null;
}

export function checkProject(components: AddedComponent[]): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const push = (issue: ProjectIssue) => issues.push(issue);

  // Files: two components writing the same path.
  const owners = new Map<string, AddedComponent[]>();
  for (const c of components) for (const f of c.files) owners.set(f.fileName, [...(owners.get(f.fileName) ?? []), c]);
  for (const [fileName, list] of owners) {
    if (list.length < 2) continue;
    push({
      id: `dup-file:${fileName}`,
      severity: "error",
      title: `${list.length} components write ${fileName}`,
      detail: "Only the last one survives in the download. Remove or rename one of them.",
      componentIds: list.map((c) => c.id),
    });
  }

  // Inventory.
  const inventories = components.filter((c) => c.recipe.reference === "ansible/inventory").map(inventoryModel);
  const allGroups = new Set<string>(["all", "ungrouped"]);
  for (const inv of inventories) for (const g of inv.groups) allGroups.add(g);
  const hasInventory = inventories.length > 0;

  const addressByHost = new Map<string, { address: string; component: AddedComponent }>();
  for (const { component, entries, parents } of inventories) {
    const cycle = findCycle(entries);
    if (cycle) {
      push({
        id: `cycle:${component.id}`,
        severity: "error",
        title: `Group nesting loops: ${cycle.join(" → ")}`,
        detail: "Ansible refuses to load an inventory whose :children form a cycle.",
        componentIds: [component.id],
      });
    }

    const populated = new Set(entries.filter((e) => e.members?.length || e.children?.length).map((e) => e.group));
    for (const entry of entries) {
      for (const child of entry.children ?? []) {
        if (!populated.has(child)) {
          push({
            id: `empty-child:${component.id}:${entry.group}:${child}`,
            severity: "warning",
            title: `[${entry.group}:children] lists "${child}", which has no hosts`,
            detail: "Probably a typo — or add hosts to that group.",
            componentIds: [component.id],
          });
        }
      }
    }

    const groupVars = new Map(entries.map((e) => [e.group, e.vars ?? {}]));
    for (const entry of entries) {
      for (const member of entry.members ?? []) {
        if (member.ansible_host) {
          const address = String(member.ansible_host);
          const seen = addressByHost.get(member.name);
          if (seen && seen.address !== address) {
            push({
              id: `addr:${member.name}:${address}`,
              severity: "error",
              title: `${member.name} has two addresses: ${seen.address} and ${address}`,
              detail: "The same host name points at different machines — Ansible uses whichever it reads last.",
              componentIds: [seen.component.id, component.id],
            });
          } else if (!seen) {
            addressByHost.set(member.name, { address, component });
          }
        }

        for (const key of ["ansible_user", "ansible_port"] as const) {
          const hostValue = member[key];
          if (hostValue === null || hostValue === undefined || hostValue === "") continue;
          for (const group of ancestors(entry.group, parents)) {
            const groupValue = groupVars.get(group)?.[key];
            if (groupValue !== undefined && String(groupValue) !== String(hostValue)) {
              push({
                id: `override:${component.id}:${member.name}:${key}:${group}`,
                severity: "warning",
                title: `${member.name} sets ${key}=${hostValue}, overriding [${group}:vars] ${key}=${groupValue}`,
                detail: `Host vars win over group vars. Clear ${key} on the host if the group value is the one you want.`,
                componentIds: [component.id],
              });
            }
          }
        }
      }
    }
  }

  if (inventories.length > 1) {
    push({
      id: "multi-inventory",
      severity: "info",
      title: `${inventories.length} inventories in this project`,
      detail: "Fine for separate environments; pass the right one with -i. Checks treat their groups as one pool.",
      componentIds: inventories.map((i) => i.component.id),
    });
  }

  // Group vars.
  const layoutsByGroup = new Map<string, AddedComponent[]>();
  for (const gv of components.filter((c) => c.recipe.reference === "ansible/group-vars")) {
    const group = gv.recipe.fields.group ?? gv.recipe.name;
    layoutsByGroup.set(group, [...(layoutsByGroup.get(group) ?? []), gv]);
  }
  for (const [group, list] of layoutsByGroup) {
    if (list.length < 2) continue;
    push({
      id: `gv-layouts:${group}`,
      severity: "warning",
      title: `Group "${group}" has both group_vars/${group}.yml and group_vars/${group}/main.yml`,
      detail: "Ansible loads and merges both, so a key set twice depends on load order. Keep one layout.",
      componentIds: list.map((c) => c.id),
    });
  }

  for (const gv of components.filter((c) => c.recipe.reference === "ansible/group-vars")) {
    const group = gv.recipe.fields.group ?? gv.recipe.name;
    if (hasInventory && !allGroups.has(group)) {
      push({
        id: `gv-group:${gv.id}`,
        severity: "warning",
        title: `group_vars/${group}.yml targets a group no inventory defines`,
        detail: "Those variables will never be loaded. Check the spelling against your inventory groups.",
        componentIds: [gv.id],
      });
    }
    const keys = groupVarsKeys(gv);
    for (const inv of inventories) {
      const inline = inv.entries.find((e) => e.group === group)?.vars ?? {};
      for (const [key, value] of Object.entries(inline)) {
        if (!keys.has(key)) continue;
        const fileValue = keys.get(key);
        if (fileValue !== null && fileValue === String(value)) continue;
        push({
          id: `gv-shadow:${gv.id}:${inv.component.id}:${key}`,
          severity: "warning",
          title: `${key} is set in both [${group}:vars] and group_vars/${group}.yml`,
          detail: `group_vars/${group}.yml wins${fileValue !== null ? ` (${fileValue} over ${value})` : ""}. Keep it in one place.`,
          componentIds: [gv.id, inv.component.id],
        });
      }
    }
  }

  // Playbooks.
  const vendoredRoles = new Set(extractAvailableRoleNames(components));
  const playbookPaths = new Map<string, AddedComponent>();
  for (const pb of components.filter((c) => c.recipe.reference === "ansible/playbook")) {
    playbookPaths.set(playbookPath(pb.recipe.name, pb.recipe.fields.folder), pb);
    const externalRoles = new Set<string>();
    playsFromRecipe(pb.recipe).forEach((play, index) => {
      const targets = play.hosts
        .split(/[:,]/)
        .map((h) => h.trim().replace(/^[!&]/, ""))
        .filter(Boolean);
      for (const target of targets) {
        if (hasInventory && !allGroups.has(target) && !addressByHost.has(target)) {
          push({
            id: `play-hosts:${pb.id}:${index}:${target}`,
            severity: "warning",
            title: `Play "${play.name || pb.recipe.name}" targets "${target}", which isn't in the inventory`,
            detail: "The play will match no hosts and silently do nothing.",
            componentIds: [pb.id],
          });
        }
      }
      for (const role of play.roles) if (!vendoredRoles.has(role)) externalRoles.add(role);
    });
    if (externalRoles.size > 0) {
      push({
        id: `ext-roles:${pb.id}`,
        severity: "info",
        title: `${pb.recipe.name} uses ${externalRoles.size} role${externalRoles.size > 1 ? "s" : ""} kikx doesn't vendor`,
        detail: `${Array.from(externalRoles).join(", ")} — they must already exist under roles/ in your repo, or scaffold empty ones here.`,
        componentIds: [pb.id],
        action: { type: "scaffold-roles", roles: Array.from(externalRoles) },
      });
    }
  }

  const sites = components.filter((c) => c.recipe.reference === "ansible/site");
  const imported = new Set<string>();
  for (const site of sites) {
    let imports: { name: string; path: string }[] = [];
    try {
      imports = JSON.parse(site.recipe.fields.playbooks ?? "[]");
    } catch {
      imports = [];
    }
    for (const imp of imports) {
      imported.add(imp.path);
      if (!playbookPaths.has(imp.path)) {
        push({
          id: `site-missing:${site.id}:${imp.path}`,
          severity: "warning",
          title: `${site.recipe.name}.yml imports ${imp.path}, which this project doesn't produce`,
          detail: "Fine if the file already exists in your repo; otherwise add that playbook.",
          componentIds: [site.id],
        });
      }
    }
  }
  if (sites.length > 0) {
    for (const [path, pb] of playbookPaths) {
      if (!imported.has(path)) {
        push({
          id: `not-imported:${pb.id}`,
          severity: "info",
          title: `${path} isn't imported by any site playbook`,
          detail: "It only runs if you call it directly.",
          componentIds: [pb.id, ...sites.map((s) => s.id)],
        });
      }
    }
  }

  // Kubernetes.
  const k8s = (kind: string) => components.filter((c) => c.recipe.reference === `k8s/${kind}`);
  const podApps = new Set(k8s("deployment").map((d) => d.recipe.labels.app ?? d.recipe.name));
  const serviceNames = new Set(k8s("service").map((s) => s.recipe.name));
  for (const svc of k8s("service")) {
    const selector = svc.recipe.labels.app ?? svc.recipe.name;
    if (!podApps.has(selector)) {
      push({
        id: `svc-selector:${svc.id}`,
        severity: "warning",
        title: `Service ${svc.recipe.name} selects app=${selector}, but no deployment has that label`,
        detail: "Its endpoints will be empty. Name the deployment the same, or set the app label.",
        componentIds: [svc.id],
      });
    }
  }
  for (const ing of k8s("ingress")) {
    const backend = ing.recipe.fields.service || ing.recipe.name;
    if (!serviceNames.has(backend)) {
      push({
        id: `ing-backend:${ing.id}`,
        severity: "warning",
        title: `Ingress ${ing.recipe.name} routes to service "${backend}", which isn't in the project`,
        componentIds: [ing.id],
      });
    }
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function issuesByComponent(issues: ProjectIssue[]): Map<string, ProjectIssue[]> {
  const map = new Map<string, ProjectIssue[]>();
  for (const issue of issues) {
    for (const id of issue.componentIds) map.set(id, [...(map.get(id) ?? []), issue]);
  }
  return map;
}
