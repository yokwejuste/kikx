import { z } from "zod";

export const initFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  namespace: z.string().min(1, "Namespace is required"),
  dir: z.string().min(1, "Output directory is required"),
});
export type InitFormValues = z.infer<typeof initFormSchema>;

const labelSchema = z.object({
  key: z.string().min(1, "Label key is required"),
  value: z.string(),
});

const baseComponentFields = {
  name: z.string().min(1, "Name is required"),
  namespace: z.string().optional(),
  labels: z.array(labelSchema),
};

const optionalPort = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.coerce.number().int().min(1).max(65535).optional(),
);

export const deploymentFormSchema = z.object({
  component: z.literal("deployment"),
  ...baseComponentFields,
  image: z.string().min(1, "Image is required"),
  replicas: z.coerce.number().int().min(1),
  port: z.coerce.number().int().min(1).max(65535),
});

export const serviceFormSchema = z.object({
  component: z.literal("service"),
  ...baseComponentFields,
  port: z.coerce.number().int().min(1).max(65535),
  targetPort: optionalPort,
});

export const ingressFormSchema = z.object({
  component: z.literal("ingress"),
  ...baseComponentFields,
  host: z.string().optional(),
  path: z.string().min(1),
  service: z.string().optional(),
  port: z.coerce.number().int().min(1).max(65535),
});

const serverFields = {
  name: z.string().min(1, "Name is required"),
  region: z.string().min(1, "Region is required"),
  size: z.string().min(1, "Size is required"),
  osImage: z.string().min(1, "OS image is required"),
  count: z.coerce.number().int().min(1),
};

export const digitalOceanFormSchema = z.object({
  component: z.literal("digitalocean"),
  ...serverFields,
});

export const hetznerFormSchema = z.object({
  component: z.literal("hetzner"),
  ...serverFields,
});

export const ansibleFormSchema = z.object({
  component: z.literal("ansible"),
  name: z.string().min(1, "Name is required"),
  hosts: z.string().min(1, "Hosts is required"),
  k8sVersion: z.string().min(1, "Kubernetes version is required"),
});

const inventoryHostSchema = z.object({
  group: z.string().min(1, "Group is required"),
  name: z.string().min(1, "Host name is required"),
  ansibleHost: z.string().min(1, "Host/IP is required"),
  ansibleUser: z.string().min(1, "SSH user is required"),
  ansiblePort: z.coerce.number().int().min(1).max(65535),
  sshKeyFile: z.string().optional(),
});
export type InventoryHostValues = z.infer<typeof inventoryHostSchema>;

const inventoryGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  children: z.string().optional(),
  vars: z.string().optional(),
});
export type InventoryGroupValues = z.infer<typeof inventoryGroupSchema>;

export const inventoryFormSchema = z.object({
  component: z.literal("inventory"),
  name: z.string().min(1, "Name is required"),
  hosts: z.array(inventoryHostSchema).min(1, "Add at least one host"),
  groups: z.array(inventoryGroupSchema).default([]),
});

export const componentFormSchema = z.discriminatedUnion("component", [
  deploymentFormSchema,
  serviceFormSchema,
  ingressFormSchema,
  digitalOceanFormSchema,
  hetznerFormSchema,
  ansibleFormSchema,
  inventoryFormSchema,
]);

export type ComponentFormValues = z.infer<typeof componentFormSchema>;
export type ComponentKind = ComponentFormValues["component"];
