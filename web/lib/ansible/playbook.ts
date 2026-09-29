import type { PlayValues, SiteImportValues } from "@/lib/forms/schemas";
import { parseJson } from "@/lib/json";
import type { PresetComponent } from "@/lib/project/preset";
import { REFERENCES } from "@/lib/registry/references";

interface RenderedPlay {
  name?: string;
  hosts?: string;
  become?: boolean;
  tags?: string[];
  roles?: (string | { role: string; when?: string })[];
  pre_tasks?: string;
  post_tasks?: string;
}

const SINGLE_FILE_ANSIBLE_REFERENCES: string[] = [
  REFERENCES.inventory,
  REFERENCES.groupvars,
  REFERENCES.playbook,
  REFERENCES.site,
];

export function playbookPath(name: string, folder?: string): string {
  return folder ? `${folder.replace(/\/+$/, "")}/${name}.yml` : `${name}.yml`;
}

export function hostPatterns(hosts: string): string[] {
  return hosts
    .split(/[:,]/)
    .map((h) => h.trim().replace(/^[!&]/, ""))
    .filter(Boolean);
}

export function stripYamlDocumentMarker(yaml: string): string {
  return yaml.replace(/^\s*-{3}\s*\n/, "");
}

export function extractAvailableRoleNames(
  components: { recipe: { reference: string; name: string }; files: unknown[] }[],
): string[] {
  return components
    .filter(
      (c) =>
        c.recipe.reference.startsWith("ansible/") &&
        !SINGLE_FILE_ANSIBLE_REFERENCES.includes(c.recipe.reference) &&
        c.files.length > 1,
    )
    .map((c) => c.recipe.name);
}

export function extractReferencedRoleNames(components: { recipe: PresetComponent }[]): string[] {
  const names = new Set<string>();
  for (const c of components) {
    if (c.recipe.reference !== REFERENCES.playbook) continue;
    for (const play of playsFromRecipe(c.recipe)) play.roles.forEach((r) => names.add(r));
  }
  return Array.from(names);
}

export function playsFromRecipe(recipe: PresetComponent): PlayValues[] {
  const plays = parseJson<RenderedPlay[] | null>(recipe.fields.plays, null);
  if (Array.isArray(plays)) {
    return plays.map((p) => {
      const conditions: Record<string, string> = {};
      const roles = (p.roles ?? []).map((r) => {
        if (typeof r === "string") return r;
        if (r.when) conditions[r.role] = r.when;
        return r.role;
      });
      return {
        name: p.name ?? recipe.name,
        hosts: p.hosts ?? "",
        roles,
        tags: p.tags ?? [],
        become: p.become ?? true,
        conditions,
        preTasks: p.pre_tasks ?? "",
        postTasks: p.post_tasks ?? "",
      };
    });
  }
  return [
    {
      name: recipe.name,
      hosts: recipe.fields.hosts ?? "",
      roles: parseJson<string[]>(recipe.fields.roles, []),
      tags: [],
      become: true,
      conditions: {},
      preTasks: "",
      postTasks: "",
    },
  ];
}

export function toRenderedPlay(play: PlayValues, fallbackName: string): RenderedPlay {
  return {
    name: play.name || fallbackName,
    hosts: play.hosts,
    become: play.become,
    tags: play.tags,
    roles: play.roles.map((role) => {
      const when = play.conditions?.[role]?.trim();
      return when ? { role, when } : role;
    }),
    ...(play.preTasks?.trim() ? { pre_tasks: stripYamlDocumentMarker(play.preTasks) } : {}),
    ...(play.postTasks?.trim() ? { post_tasks: stripYamlDocumentMarker(play.postTasks) } : {}),
  };
}

export function siteImportsFromRecipe(recipe: PresetComponent): SiteImportValues[] {
  const imports = parseJson<SiteImportValues[]>(recipe.fields.playbooks, []);
  return Array.isArray(imports) ? imports : [];
}
