import { z } from "zod";

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HOSTNAME_RE = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

function isValidHostOrIp(value: string): boolean {
  return IPV4_RE.test(value) || value.includes(":") || HOSTNAME_RE.test(value);
}

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

const GROUP_NAME_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const groupName = z
  .string()
  .min(1, "Group name is required")
  .regex(GROUP_NAME_RE, "Letters, digits, _ and - only; start with a letter or _");

const optionalHostOrIp = z
  .string()
  .optional()
  .refine((v) => !v || isValidHostOrIp(v), "Enter a valid IP address or hostname");

const optionalSshPort = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.coerce
    .number({ invalid_type_error: "Port must be a number" })
    .int("Port must be a whole number")
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535")
    .optional(),
);

const inventoryHostSchema = z.object({
  name: z.string().min(1, "Host name is required"),
  ansibleHost: optionalHostOrIp,
  groups: z.array(groupName).min(1, "Put the host in at least one group"),
  ansibleUser: z.string().optional(),
  ansiblePort: optionalSshPort,
  sshKeyFile: z.string().optional(),
  vars: z.string().optional(),
});
export type InventoryHostValues = z.infer<typeof inventoryHostSchema>;

const inventoryGroupSchema = z.object({
  name: groupName,
  children: z.array(z.string()).default([]),
  vars: z.string().optional(),
});
export type InventoryGroupValues = z.infer<typeof inventoryGroupSchema>;

export const inventoryFormSchema = z
  .object({
    component: z.literal("inventory"),
    name: z.string().min(1, "Name is required"),
    hosts: z.array(inventoryHostSchema).min(1, "Add at least one host"),
    groups: z.array(inventoryGroupSchema).default([]),
  })
  .superRefine((values, ctx) => {
    const seen = new Map<string, number>();
    values.hosts.forEach((host, index) => {
      const first = seen.get(host.name);
      if (first !== undefined && host.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hosts", index, "name"],
          message: `"${host.name}" is already host #${first + 1} — add the extra groups to that host instead`,
        });
      } else {
        seen.set(host.name, index);
      }
    });
    const groupSeen = new Set<string>();
    values.groups.forEach((group, index) => {
      if (groupSeen.has(group.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["groups", index, "name"],
          message: `Group "${group.name}" is listed twice`,
        });
      }
      groupSeen.add(group.name);
      if (group.children.includes(group.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["groups", index, "children"],
          message: "A group can't contain itself",
        });
      }
    });
  });

export const groupVarsFormSchema = z
  .object({
    component: z.literal("groupvars"),
    group: groupName,
    mode: z.enum(["fields", "yaml"]),
    /** "file" → group_vars/<group>.yml, "dir" → group_vars/<group>/main.yml */
    layout: z.enum(["file", "dir"]).default("file"),
    // Rows are only checked in key/value mode — a blank starter row mustn't block YAML mode.
    vars: z.array(z.object({ key: z.string(), value: z.string() })),
    yaml: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "fields") {
      if (!values.vars.some((v) => v.key.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vars"], message: "Add at least one variable" });
      }
      values.vars.forEach((v, index) => {
        if (!v.key.trim() && v.value.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vars", index, "key"], message: "Give this value a key" });
        }
      });
    }
    if (values.mode === "yaml" && !values.yaml?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["yaml"], message: "Paste some YAML" });
    }
  });

const playSchema = z.object({
  name: z.string().min(1, "Give the play a name"),
  hosts: z.string().min(1, "Pick a group to run on"),
  roles: z.array(z.string()).min(1, "Add at least one role"),
  tags: z.array(z.string()).default([]),
  become: z.boolean().default(true),
  /** role name → `when:` condition; roles without one render as plain names */
  conditions: z.record(z.string()).default({}),
  preTasks: z.string().optional(),
  postTasks: z.string().optional(),
});
export type PlayValues = z.infer<typeof playSchema>;

const safeFolder = z
  .string()
  .optional()
  .refine((v) => !v || (!v.startsWith("/") && !v.split("/").includes("..")), "Use a relative folder like playbooks");

export const playbookFormSchema = z.object({
  component: z.literal("playbook"),
  name: z.string().min(1, "Name is required"),
  folder: safeFolder,
  plays: z.array(playSchema).min(1, "Add at least one play"),
});

const siteImportSchema = z.object({
  name: z.string().min(1, "Give it a name"),
  path: z.string().min(1, "Path is required"),
});
export type SiteImportValues = z.infer<typeof siteImportSchema>;

export const siteFormSchema = z.object({
  component: z.literal("site"),
  name: z.string().min(1, "Name is required"),
  imports: z.array(siteImportSchema).min(1, "Import at least one playbook"),
});

export const commonRoleFormSchema = z.object({
  component: z.literal("commonrole"),
  name: z.string().min(1, "Name is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

export const roleFormSchema = z.object({
  component: z.literal("role"),
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^[A-Za-z0-9_.-]+$/, "Letters, digits, _ . and - only"),
  description: z.string().optional(),
});

export type ComponentKind =
  | "deployment"
  | "service"
  | "ingress"
  | "digitalocean"
  | "hetzner"
  | "ansible"
  | "inventory"
  | "groupvars"
  | "playbook"
  | "site"
  | "commonrole"
  | "role";
