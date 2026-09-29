import { parseJson } from "@/lib/json";

export function groupVarsPath(group: string, layout: string | undefined): string {
  return `group_vars/${group}${layout === "dir" ? "/main" : ""}`;
}

export function groupVarsRecord(raw: string | undefined): Record<string, unknown> {
  const parsed = parseJson<unknown>(raw, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
}

export function groupVarsKeys(fields: Record<string, string>): Map<string, string | null> {
  const keys = new Map<string, string | null>();
  if (fields.yaml) {
    for (const line of fields.yaml.split("\n")) {
      const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (match) keys.set(match[1], match[2] ? match[2].replace(/^["']|["']$/g, "") : null);
    }
  } else {
    for (const [k, v] of Object.entries(groupVarsRecord(fields.vars))) keys.set(k, String(v));
  }
  return keys;
}
