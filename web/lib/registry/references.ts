export const REFERENCES = {
  deployment: "k8s/deployment",
  service: "k8s/service",
  ingress: "k8s/ingress",
  ansible: "ansible/k8s-bootstrap",
  inventory: "ansible/inventory",
  groupvars: "ansible/group-vars",
  playbook: "ansible/playbook",
  site: "ansible/site",
  commonrole: "ansible/common-role",
  role: "ansible/role",
  ansiblecfg: "ansible/config",
} as const;

export const SERVER_CATEGORY = "terraform";

type FixedKind = keyof typeof REFERENCES;

export type ComponentKind = FixedKind | "server";

export const K8S_KINDS = new Set<ComponentKind>(["deployment", "service", "ingress"]);

function isServerReference(reference: string): boolean {
  return reference.startsWith(`${SERVER_CATEGORY}/`);
}

export function kindForReference(reference: string): ComponentKind | null {
  if (isServerReference(reference)) return "server";
  const entry = Object.entries(REFERENCES).find(([, ref]) => ref === reference);
  return entry ? (entry[0] as FixedKind) : null;
}

export function fixedReference(kind: ComponentKind): string | null {
  return kind === "server" ? null : REFERENCES[kind];
}
