import type { InventoryGroupValues, InventoryHostValues } from "@/lib/forms/schemas";
import { parseJson } from "@/lib/json";
import type { AddedComponent } from "@/lib/project/context";
import { REFERENCES } from "@/lib/registry/references";

type Scalar = string | number | null;
type SectionKind = "hosts" | "children" | "vars";

interface InventoryMember {
  name: string;
  ansible_host: Scalar;
  ansible_user: Scalar;
  ansible_port: Scalar;
  ssh_key_file?: string;
  vars?: Record<string, string>;
}

export interface InventoryGroupEntry {
  group: string;
  members?: InventoryMember[];
  children?: string[];
  vars?: Record<string, string>;
}

export function parseKeyValuePairs(raw?: string): [string, string][] {
  const pairs: [string, string][] = [];
  let token = "";
  let quote: string | null = null;
  const flush = () => {
    const eq = token.indexOf("=");
    if (eq > 0) pairs.push([token.slice(0, eq).trim(), token.slice(eq + 1)]);
    token = "";
  };
  for (const ch of raw ?? "") {
    if (quote) {
      token += ch;
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      token += ch;
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (token) flush();
    } else {
      token += ch;
    }
  }
  if (token) flush();
  return pairs;
}

function formatKeyValuePairs(vars: Record<string, string> | undefined, separator = " "): string {
  return Object.entries(vars ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join(separator);
}

function varsRecord(raw?: string): Record<string, string> | undefined {
  const pairs = parseKeyValuePairs(raw);
  return pairs.length > 0 ? Object.fromEntries(pairs) : undefined;
}

export function buildInventoryGroups(hosts: InventoryHostValues[], groups: InventoryGroupValues[]) {
  const byName = new Map<string, InventoryGroupEntry>();
  const entryFor = (name: string) => {
    if (!byName.has(name)) byName.set(name, { group: name });
    return byName.get(name)!;
  };

  for (const group of groups) entryFor(group.name);

  for (const host of hosts) {
    host.groups.forEach((groupName, index) => {
      const vars = varsRecord(host.vars);
      const member: InventoryMember =
        index === 0
          ? {
              name: host.name,
              ansible_host: host.ansibleHost || null,
              ansible_user: host.ansibleUser || null,
              ansible_port: host.ansiblePort ?? null,
              ...(host.sshKeyFile ? { ssh_key_file: host.sshKeyFile } : {}),
              ...(vars ? { vars } : {}),
            }
          : { name: host.name, ansible_host: null, ansible_user: null, ansible_port: null };
      (entryFor(groupName).members ??= []).push(member);
    });
  }

  for (const group of groups) {
    const entry = entryFor(group.name);
    if (group.children.length > 0) entry.children = group.children;
    const vars = varsRecord(group.vars);
    if (vars) entry.vars = vars;
  }

  return Array.from(byName.values()).filter((g) => g.members?.length || g.children?.length || g.vars);
}

export function parseInventoryEntries(raw: string | undefined): InventoryGroupEntry[] {
  const parsed = parseJson<InventoryGroupEntry[]>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function groupNamesFromEntries(entries: InventoryGroupEntry[]): string[] {
  const names = new Set<string>();
  for (const entry of entries) {
    names.add(entry.group);
    for (const child of entry.children ?? []) names.add(child);
  }
  return Array.from(names);
}

export function extractInventoryGroupNames(components: AddedComponent[]): string[] {
  const names = new Set<string>();
  for (const component of components) {
    if (component.recipe.reference !== REFERENCES.inventory) continue;
    for (const name of groupNamesFromEntries(parseInventoryEntries(component.recipe.fields.hosts))) {
      names.add(name);
    }
  }
  return Array.from(names);
}

export function entriesToFormValues(
  entries: InventoryGroupEntry[],
  fallback: { user: string; port: number | undefined },
): {
  hosts: InventoryHostValues[];
  groups: InventoryGroupValues[];
} {
  const hosts = new Map<string, InventoryHostValues>();
  for (const entry of entries) {
    for (const member of entry.members ?? []) {
      const existing = hosts.get(member.name);
      if (existing) {
        if (!existing.groups.includes(entry.group)) existing.groups.push(entry.group);
        continue;
      }
      hosts.set(member.name, {
        name: member.name,
        ansibleHost: member.ansible_host ? String(member.ansible_host) : "",
        groups: [entry.group],
        ansibleUser:
          member.ansible_user === undefined ? fallback.user : member.ansible_user ? String(member.ansible_user) : "",
        ansiblePort:
          member.ansible_port === undefined
            ? fallback.port
            : member.ansible_port
              ? Number(member.ansible_port)
              : undefined,
        sshKeyFile: member.ssh_key_file ?? "",
        vars: formatKeyValuePairs(member.vars),
      });
    }
  }
  const groups: InventoryGroupValues[] = entries.map((entry) => ({
    name: entry.group,
    children: entry.children ?? [],
    vars: formatKeyValuePairs(entry.vars, "\n"),
  }));
  return { hosts: Array.from(hosts.values()), groups };
}

export interface ParsedInventory {
  hosts: InventoryHostValues[];
  groups: InventoryGroupValues[];
  warnings: string[];
}

export function parseInventoryIni(text: string): ParsedInventory {
  const hosts = new Map<string, InventoryHostValues>();
  const groups = new Map<string, InventoryGroupValues>();
  const warnings: string[] = [];
  const groupFor = (name: string) => {
    if (!groups.has(name)) groups.set(name, { name, children: [], vars: "" });
    return groups.get(name)!;
  };

  let section: { group: string; kind: SectionKind } | null = null;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) return;

    const header = line.match(/^\[([^\]:]+)(?::(children|vars))?\]$/);
    if (header) {
      section = { group: header[1].trim(), kind: (header[2] as SectionKind | undefined) ?? "hosts" };
      groupFor(section.group);
      return;
    }
    if (!section) {
      warnings.push(`Line ${index + 1}: "${line}" is outside any [group] section — skipped.`);
      return;
    }

    const current: { group: string; kind: SectionKind } = section;
    const group = groupFor(current.group);
    if (current.kind === "children") {
      if (!group.children.includes(line)) group.children.push(line);
      return;
    }
    if (current.kind === "vars") {
      group.vars = group.vars ? `${group.vars}\n${line}` : line;
      return;
    }

    const [hostName, ...rest] = line.split(/\s+/);
    let host = hosts.get(hostName);
    if (!host) {
      host = { name: hostName, ansibleHost: "", groups: [], ansibleUser: "", ansiblePort: undefined, sshKeyFile: "", vars: "" };
      hosts.set(hostName, host);
    }
    if (!host.groups.includes(current.group)) host.groups.push(current.group);

    const keep = (field: string, existing: string | undefined, value: string) => {
      if (existing && existing !== value) {
        warnings.push(`${hostName}: ${field} is "${existing}" in one group but "${value}" in [${current.group}] — kept the first.`);
        return existing;
      }
      return existing || value;
    };
    const extra = new Map(parseKeyValuePairs(host.vars));
    for (const [key, value] of parseKeyValuePairs(rest.join(" "))) {
      if (key === "ansible_host") host.ansibleHost = keep(key, host.ansibleHost, value);
      else if (key === "ansible_user") host.ansibleUser = keep(key, host.ansibleUser, value);
      else if (key === "ansible_port") host.ansiblePort = Number(keep(key, host.ansiblePort?.toString(), value));
      else if (key === "ansible_ssh_private_key_file") host.sshKeyFile = keep(key, host.sshKeyFile, value);
      else extra.set(key, keep(key, extra.get(key), value));
    }
    host.vars = formatKeyValuePairs(Object.fromEntries(extra));
  });

  for (const host of hosts.values()) {
    if (!host.ansibleHost) {
      warnings.push(`${host.name} has no ansible_host — Ansible will try to resolve the name itself.`);
    }
  }

  return { hosts: Array.from(hosts.values()), groups: Array.from(groups.values()), warnings };
}
