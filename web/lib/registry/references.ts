export const REFERENCES = {
  deployment: "k8s/deployment",
  service: "k8s/service",
  ingress: "k8s/ingress",
  digitalocean: "terraform/digitalocean",
  hetzner: "terraform/hetzner",
  ansible: "ansible/k8s-bootstrap",
  inventory: "ansible/inventory",
  groupvars: "ansible/group-vars",
  playbook: "ansible/playbook",
  site: "ansible/site",
  commonrole: "ansible/common-role",
  role: "ansible/role",
} as const;

export type ComponentKind = keyof typeof REFERENCES;

export const K8S_KINDS = new Set<ComponentKind>(["deployment", "service", "ingress"]);

export function kindForReference(reference: string): ComponentKind | null {
  const entry = Object.entries(REFERENCES).find(([, ref]) => ref === reference);
  return entry ? (entry[0] as ComponentKind) : null;
}
