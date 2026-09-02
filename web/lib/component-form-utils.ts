import type { RenderRequest } from "@/lib/api-client";
import { OS_IMAGES } from "@/lib/os-images";
import {
  deploymentFormSchema,
  serviceFormSchema,
  ingressFormSchema,
  digitalOceanFormSchema,
  hetznerFormSchema,
  ansibleFormSchema,
  inventoryFormSchema,
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
  inventory: inventoryFormSchema,
};

export const REFERENCES: Record<ComponentKind, string> = {
  deployment: "k8s/deployment",
  service: "k8s/service",
  ingress: "k8s/ingress",
  digitalocean: "terraform/digitalocean",
  hetzner: "terraform/hetzner",
  ansible: "ansible/k8s-bootstrap",
  inventory: "ansible/inventory",
};

export const K8S_KINDS = new Set<ComponentKind>(["deployment", "service", "ingress"]);

type DeploymentValues = z.infer<typeof deploymentFormSchema>;
type ServiceValues = z.infer<typeof serviceFormSchema>;
type IngressValues = z.infer<typeof ingressFormSchema>;
type DigitalOceanValues = z.infer<typeof digitalOceanFormSchema>;
type HetznerValues = z.infer<typeof hetznerFormSchema>;
type AnsibleValues = z.infer<typeof ansibleFormSchema>;
type InventoryValues = z.infer<typeof inventoryFormSchema>;
export type FormValues =
  | DeploymentValues
  | ServiceValues
  | IngressValues
  | DigitalOceanValues
  | HetznerValues
  | AnsibleValues
  | InventoryValues;

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
    case "inventory":
      return {
        component: "inventory",
        name: "",
        group: "control_plane",
        ansibleHost: "",
        ansibleUser: "root",
        ansiblePort: 22,
        sshKeyFile: "",
      };
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
  if (values.component === "ansible") {
    return {
      ...base,
      fields: { hosts: values.hosts, k8s_version: values.k8sVersion },
    };
  }
  return {
    ...base,
    fields: {
      group: values.group,
      ansible_host: values.ansibleHost,
      ansible_user: values.ansibleUser,
      ansible_port: values.ansiblePort.toString(),
      ssh_key_file: values.sshKeyFile ?? "",
    },
  };
}
