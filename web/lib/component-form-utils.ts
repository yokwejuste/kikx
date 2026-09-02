import type { RenderRequest } from "@/lib/api-client";
import {
  deploymentFormSchema,
  serviceFormSchema,
  ingressFormSchema,
  digitalOceanFormSchema,
  hetznerFormSchema,
  ansibleFormSchema,
  type ComponentKind,
} from "@/lib/schemas";
import type { z } from "zod";

export const schemas = {
  deployment: deploymentFormSchema,
  service: serviceFormSchema,
  ingress: ingressFormSchema,
  digitalocean: digitalOceanFormSchema,
  hetzner: hetznerFormSchema,
  ansible: ansibleFormSchema,
};

export const REFERENCES: Record<ComponentKind, string> = {
  deployment: "k8s/deployment",
  service: "k8s/service",
  ingress: "k8s/ingress",
  digitalocean: "terraform/digitalocean",
  hetzner: "terraform/hetzner",
  ansible: "ansible/k8s-bootstrap",
};

export const K8S_KINDS = new Set<ComponentKind>(["deployment", "service", "ingress"]);

export const OS_IMAGES: Record<"digitalocean" | "hetzner", { label: string; slug: string }[]> = {
  digitalocean: [
    { label: "Ubuntu 24.04", slug: "ubuntu-24-04-x64" },
    { label: "Ubuntu 22.04", slug: "ubuntu-22-04-x64" },
    { label: "Debian 13", slug: "debian-13-x64" },
    { label: "Fedora 44", slug: "fedora-44-x64" },
    { label: "Rocky Linux 9", slug: "rockylinux-9-x64" },
    { label: "AlmaLinux 9", slug: "almalinux-9-x64" },
  ],
  hetzner: [
    { label: "Ubuntu 24.04", slug: "ubuntu-24.04" },
    { label: "Ubuntu 22.04", slug: "ubuntu-22.04" },
    { label: "Debian 12", slug: "debian-12" },
    { label: "Fedora 44", slug: "fedora-44" },
    { label: "Rocky Linux 9", slug: "rocky-9" },
    { label: "AlmaLinux 9", slug: "alma-9" },
  ],
};

type DeploymentValues = z.infer<typeof deploymentFormSchema>;
type ServiceValues = z.infer<typeof serviceFormSchema>;
type IngressValues = z.infer<typeof ingressFormSchema>;
type DigitalOceanValues = z.infer<typeof digitalOceanFormSchema>;
type HetznerValues = z.infer<typeof hetznerFormSchema>;
type AnsibleValues = z.infer<typeof ansibleFormSchema>;
export type FormValues =
  | DeploymentValues
  | ServiceValues
  | IngressValues
  | DigitalOceanValues
  | HetznerValues
  | AnsibleValues;

export function defaultsFor(kind: ComponentKind): FormValues {
  switch (kind) {
    case "deployment":
      return {
        component: "deployment",
        name: "",
        namespace: "",
        labels: [],
        image: "",
        replicas: 1,
        port: 80,
      };
    case "service":
      return {
        component: "service",
        name: "",
        namespace: "",
        labels: [],
        port: 80,
        targetPort: undefined,
      };
    case "ingress":
      return {
        component: "ingress",
        name: "",
        namespace: "",
        labels: [],
        host: "",
        path: "/",
        service: "",
        port: 80,
      };
    case "digitalocean":
      return {
        component: "digitalocean",
        name: "",
        region: "",
        size: "",
        osImage: OS_IMAGES.digitalocean[0].slug,
        count: 1,
      };
    case "hetzner":
      return {
        component: "hetzner",
        name: "",
        region: "",
        size: "",
        osImage: OS_IMAGES.hetzner[0].slug,
        count: 1,
      };
    case "ansible":
      return { component: "ansible", name: "", hosts: "", k8sVersion: "" };
  }
}

export function toRenderRequest(defaultNamespace: string, values: FormValues): RenderRequest {
  const base: RenderRequest = {
    reference: REFERENCES[values.component],
    name: values.name,
    defaultNamespace,
  };

  if (values.component === "deployment") {
    return {
      ...base,
      namespace: values.namespace || undefined,
      labels: values.labels,
      image: values.image,
      replicas: values.replicas,
      port: values.port,
    };
  }
  if (values.component === "service") {
    return {
      ...base,
      namespace: values.namespace || undefined,
      labels: values.labels,
      port: values.port,
      targetPort: values.targetPort,
    };
  }
  if (values.component === "ingress") {
    return {
      ...base,
      namespace: values.namespace || undefined,
      labels: values.labels,
      host: values.host || undefined,
      path: values.path,
      service: values.service || undefined,
      port: values.port,
    };
  }
  if (values.component === "digitalocean" || values.component === "hetzner") {
    return {
      ...base,
      fields: {
        region: values.region,
        size: values.size,
        os_image: values.osImage,
        count: values.count.toString(),
      },
    };
  }
  return {
    ...base,
    fields: { hosts: values.hosts, k8s_version: values.k8sVersion },
  };
}
