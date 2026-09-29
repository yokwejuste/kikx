import { groupVarsKeys } from "@/lib/ansible/group-vars";
import { parseInventoryEntries, type InventoryGroupEntry } from "@/lib/ansible/inventory";
import {
  extractAvailableRoleNames,
  hostPatterns,
  playbookPath,
  playsFromRecipe,
  siteImportsFromRecipe,
} from "@/lib/ansible/playbook";
import type { LocalizedMessage } from "@/lib/i18n/localized-error";
import type { AddedComponent } from "@/lib/project/context";
import { REFERENCES } from "@/lib/registry/references";

export type IssueSeverity = "error" | "warning" | "info";

export interface ProjectIssue {
  id: string;
  severity: IssueSeverity;
  title: LocalizedMessage;
  detail?: LocalizedMessage;
  componentIds: string[];
  action?: { type: "scaffold-roles"; roles: string[] };
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };

interface InventoryModel {
  component: AddedComponent;
  entries: InventoryGroupEntry[];
  groups: Set<string>;
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
  const byReference = (reference: string) => components.filter((c) => c.recipe.reference === reference);

  const owners = new Map<string, AddedComponent[]>();
  for (const c of components) for (const f of c.files) owners.set(f.fileName, [...(owners.get(f.fileName) ?? []), c]);
  for (const [fileName, list] of owners) {
    if (list.length < 2) continue;
    push({
      id: `dup-file:${fileName}`,
      severity: "error",
      title: { key: "checks.issues.dupFile.title", values: { count: list.length, file: fileName } },
      detail: { key: "checks.issues.dupFile.detail" },
      componentIds: list.map((c) => c.id),
    });
  }

  const inventories = byReference(REFERENCES.inventory).map(inventoryModel);
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
        title: { key: "checks.issues.cycle.title", values: { path: cycle.join(" → ") } },
        detail: { key: "checks.issues.cycle.detail" },
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
            title: { key: "checks.issues.emptyChild.title", values: { group: entry.group, child } },
            detail: { key: "checks.issues.emptyChild.detail" },
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
              title: { key: "checks.issues.address.title", values: { host: member.name, first: seen.address, second: address } },
              detail: { key: "checks.issues.address.detail" },
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
                title: {
                  key: "checks.issues.override.title",
                  values: { host: member.name, key, value: String(hostValue), group, groupValue: String(groupValue) },
                },
                detail: { key: "checks.issues.override.detail", values: { key } },
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
      title: { key: "checks.issues.multiInventory.title", values: { count: inventories.length } },
      detail: { key: "checks.issues.multiInventory.detail" },
      componentIds: inventories.map((i) => i.component.id),
    });
  }

  const groupVarsComponents = byReference(REFERENCES.groupvars);
  const layoutsByGroup = new Map<string, AddedComponent[]>();
  for (const gv of groupVarsComponents) {
    const group = gv.recipe.fields.group ?? gv.recipe.name;
    layoutsByGroup.set(group, [...(layoutsByGroup.get(group) ?? []), gv]);
  }
  for (const [group, list] of layoutsByGroup) {
    if (list.length < 2) continue;
    push({
      id: `gv-layouts:${group}`,
      severity: "warning",
      title: { key: "checks.issues.layouts.title", values: { group } },
      detail: { key: "checks.issues.layouts.detail" },
      componentIds: list.map((c) => c.id),
    });
  }

  for (const gv of groupVarsComponents) {
    const group = gv.recipe.fields.group ?? gv.recipe.name;
    if (hasInventory && !allGroups.has(group)) {
      push({
        id: `gv-group:${gv.id}`,
        severity: "warning",
        title: { key: "checks.issues.unknownGroup.title", values: { group } },
        detail: { key: "checks.issues.unknownGroup.detail" },
        componentIds: [gv.id],
      });
    }
    const keys = groupVarsKeys(gv.recipe.fields);
    for (const inv of inventories) {
      const inline = inv.entries.find((e) => e.group === group)?.vars ?? {};
      for (const [key, value] of Object.entries(inline)) {
        if (!keys.has(key)) continue;
        const fileValue = keys.get(key);
        if (fileValue !== null && fileValue === String(value)) continue;
        push({
          id: `gv-shadow:${gv.id}:${inv.component.id}:${key}`,
          severity: "warning",
          title: { key: "checks.issues.shadow.title", values: { key, group } },
          detail:
            fileValue !== null
              ? { key: "checks.issues.shadow.detailValues", values: { group, fileValue: String(fileValue), value: String(value) } }
              : { key: "checks.issues.shadow.detail", values: { group } },
          componentIds: [gv.id, inv.component.id],
        });
      }
    }
  }

  const vendoredRoles = new Set(extractAvailableRoleNames(components));
  const playbookPaths = new Map<string, AddedComponent>();
  for (const pb of byReference(REFERENCES.playbook)) {
    playbookPaths.set(playbookPath(pb.recipe.name, pb.recipe.fields.folder), pb);
    const externalRoles = new Set<string>();
    playsFromRecipe(pb.recipe).forEach((play, index) => {
      for (const target of hostPatterns(play.hosts)) {
        if (hasInventory && !allGroups.has(target) && !addressByHost.has(target)) {
          push({
            id: `play-hosts:${pb.id}:${index}:${target}`,
            severity: "warning",
            title: { key: "checks.issues.playHosts.title", values: { play: play.name || pb.recipe.name, target } },
            detail: { key: "checks.issues.playHosts.detail" },
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
        title: { key: "checks.issues.externalRoles.title", values: { playbook: pb.recipe.name, count: externalRoles.size } },
        detail: { key: "checks.issues.externalRoles.detail", values: { roles: Array.from(externalRoles).join(", ") } },
        componentIds: [pb.id],
        action: { type: "scaffold-roles", roles: Array.from(externalRoles) },
      });
    }
  }

  const sites = byReference(REFERENCES.site);
  const imported = new Set<string>();
  for (const site of sites) {
    for (const imp of siteImportsFromRecipe(site.recipe)) {
      imported.add(imp.path);
      if (!playbookPaths.has(imp.path)) {
        push({
          id: `site-missing:${site.id}:${imp.path}`,
          severity: "warning",
          title: { key: "checks.issues.siteMissing.title", values: { site: site.recipe.name, path: imp.path } },
          detail: { key: "checks.issues.siteMissing.detail" },
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
          title: { key: "checks.issues.notImported.title", values: { path } },
          detail: { key: "checks.issues.notImported.detail" },
          componentIds: [pb.id, ...sites.map((s) => s.id)],
        });
      }
    }
  }

  const services = byReference(REFERENCES.service);
  const podApps = new Set(byReference(REFERENCES.deployment).map((d) => d.recipe.labels.app ?? d.recipe.name));
  const serviceNames = new Set(services.map((s) => s.recipe.name));
  for (const svc of services) {
    const selector = svc.recipe.labels.app ?? svc.recipe.name;
    if (!podApps.has(selector)) {
      push({
        id: `svc-selector:${svc.id}`,
        severity: "warning",
        title: { key: "checks.issues.serviceSelector.title", values: { service: svc.recipe.name, selector } },
        detail: { key: "checks.issues.serviceSelector.detail" },
        componentIds: [svc.id],
      });
    }
  }
  for (const ing of byReference(REFERENCES.ingress)) {
    const backend = ing.recipe.fields.service || ing.recipe.name;
    if (!serviceNames.has(backend)) {
      push({
        id: `ing-backend:${ing.id}`,
        severity: "warning",
        title: { key: "checks.issues.ingressBackend.title", values: { ingress: ing.recipe.name, backend } },
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
