import type { InventoryGroupValues, InventoryHostValues } from "@/lib/schemas";

interface InventoryGroupEntry {
  group: string;
  members?: Record<string, string | number>[];
  children?: string[];
  vars?: Record<string, string>;
}

function parseCommaList(raw?: string): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseVars(raw?: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const pair of parseCommaList(raw)) {
    const [key, ...rest] = pair.split("=");
    if (key && rest.length > 0) vars[key.trim()] = rest.join("=").trim();
  }
  return vars;
}

export function buildInventoryGroups(hosts: InventoryHostValues[], groups: InventoryGroupValues[]) {
  const byName = new Map<string, InventoryGroupEntry>();
  const entryFor = (name: string) => {
    if (!byName.has(name)) byName.set(name, { group: name });
    return byName.get(name)!;
  };

  for (const host of hosts) {
    const entry = entryFor(host.group);
    const member: Record<string, string | number> = {
      name: host.name,
      ansible_host: host.ansibleHost,
      ansible_user: host.ansibleUser,
      ansible_port: host.ansiblePort,
    };
    if (host.sshKeyFile) member.ssh_key_file = host.sshKeyFile;
    (entry.members ??= []).push(member);
  }

  for (const group of groups) {
    if (!group.name) continue;
    const entry = entryFor(group.name);
    const children = parseCommaList(group.children);
    if (children.length > 0) entry.children = children;
    const vars = parseVars(group.vars);
    if (Object.keys(vars).length > 0) entry.vars = vars;
  }

  return Array.from(byName.values());
}
