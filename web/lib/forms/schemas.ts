import { z } from "zod";
import { validationMessage as m } from "@/lib/i18n/localized-error";
import { registryItem } from "@/lib/registry/store";

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HOSTNAME_RE = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

function isValidHostOrIp(value: string): boolean {
  return IPV4_RE.test(value) || value.includes(":") || HOSTNAME_RE.test(value);
}

export const projectNameSchema = z.object({
  name: z.string().min(1, m("projectNameRequired")),
});
export type ProjectNameValues = z.infer<typeof projectNameSchema>;

export const projectSettingsSchema = z.object({
  namespace: z.string().min(1, m("namespaceRequired")),
  dir: z.string().min(1, m("outputDirRequired")),
});
export type ProjectSettingsValues = z.infer<typeof projectSettingsSchema>;

const labelSchema = z.object({
  key: z.string().min(1, m("labelKeyRequired")),
  value: z.string(),
});

const baseComponentFields = {
  name: z.string().min(1, m("nameRequired")),
  namespace: z.string().optional(),
  labels: z.array(labelSchema),
};

const port = () =>
  z.coerce
    .number({ invalid_type_error: m("portNumber") })
    .int(m("portWhole"))
    .min(1, m("portRange"))
    .max(65535, m("portRange"));

const atLeastOne = () =>
  z.coerce.number({ invalid_type_error: m("number") }).int(m("wholeNumber")).min(1, m("atLeastOne"));

const optionalPort = z.preprocess((val) => (val === "" || val === undefined ? undefined : val), port().optional());

export const deploymentFormSchema = z.object({
  component: z.literal("deployment"),
  ...baseComponentFields,
  image: z.string().min(1, m("imageRequired")),
  replicas: atLeastOne(),
  port: port(),
});

export const serviceFormSchema = z.object({
  component: z.literal("service"),
  ...baseComponentFields,
  port: port(),
  targetPort: optionalPort,
});

export const ingressFormSchema = z.object({
  component: z.literal("ingress"),
  ...baseComponentFields,
  host: z.string().optional(),
  path: z.string().min(1, m("pathRequired")),
  service: z.string().optional(),
  port: port(),
});

export const serverFormSchema = z
  .object({
    component: z.literal("server"),
    name: z.string().min(1, m("nameRequired")),
    provider: z.string().min(1, m("providerRequired")),
    fields: z.record(z.string(), z.string()),
  })
  .superRefine((values, context) => {
    for (const spec of registryItem(values.provider)?.fields ?? []) {
      if (spec.required && !(values.fields[spec.name] ?? "").trim()) {
        context.addIssue({ code: "custom", path: ["fields", spec.name], message: m("fieldRequired") });
      }
    }
  });

export const ansibleFormSchema = z.object({
  component: z.literal("ansible"),
  name: z.string().min(1, m("nameRequired")),
  hosts: z.string().min(1, m("hostsRequired")),
  k8sVersion: z.string().min(1, m("k8sVersionRequired")),
});

const GROUP_NAME_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const groupName = z
  .string()
  .min(1, m("groupNameRequired"))
  .regex(GROUP_NAME_RE, m("groupNameFormat"));

const optionalHostOrIp = z
  .string()
  .optional()
  .refine((v) => !v || isValidHostOrIp(v), m("addressInvalid"));

const optionalSshPort = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  port().optional(),
);

const inventoryHostSchema = z.object({
  name: z.string().min(1, m("hostNameRequired")),
  ansibleHost: optionalHostOrIp,
  groups: z.array(groupName).min(1, m("hostGroupsRequired")),
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
    name: z.string().min(1, m("nameRequired")),
    hosts: z.array(inventoryHostSchema).min(1, m("addHost")),
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
          message: m("hostDuplicate", { name: host.name, index: first + 1 }),
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
          message: m("groupDuplicate", { name: group.name }),
        });
      }
      groupSeen.add(group.name);
      if (group.children.includes(group.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["groups", index, "children"],
          message: m("groupSelf"),
        });
      }
    });
  });

export const groupVarsFormSchema = z
  .object({
    component: z.literal("groupvars"),
    group: groupName,
    mode: z.enum(["fields", "yaml"]),
    layout: z.enum(["file", "dir"]).default("file"),
    vars: z.array(z.object({ key: z.string(), value: z.string() })),
    yaml: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "fields") {
      if (!values.vars.some((v) => v.key.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vars"], message: m("addVariable") });
      }
      values.vars.forEach((v, index) => {
        if (!v.key.trim() && v.value.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vars", index, "key"], message: m("variableKey") });
        }
      });
    }
    if (values.mode === "yaml" && !values.yaml?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["yaml"], message: m("pasteYaml") });
    }
  });

const playSchema = z.object({
  name: z.string().min(1, m("playName")),
  hosts: z.string().min(1, m("playHosts")),
  roles: z.array(z.string()).min(1, m("playRoles")),
  tags: z.array(z.string()).default([]),
  become: z.boolean().default(true),
  conditions: z.record(z.string()).default({}),
  preTasks: z.string().optional(),
  postTasks: z.string().optional(),
});
export type PlayValues = z.infer<typeof playSchema>;

const safeFolder = z
  .string()
  .optional()
  .refine((v) => !v || (!v.startsWith("/") && !v.split("/").includes("..")), m("folderRelative"));

export const playbookFormSchema = z.object({
  component: z.literal("playbook"),
  name: z.string().min(1, m("nameRequired")),
  folder: safeFolder,
  plays: z.array(playSchema).min(1, m("addPlay")),
});

const siteImportSchema = z.object({
  name: z.string().min(1, m("importName")),
  path: z.string().min(1, m("importPath")),
});
export type SiteImportValues = z.infer<typeof siteImportSchema>;

export const siteFormSchema = z.object({
  component: z.literal("site"),
  name: z.string().min(1, m("nameRequired")),
  imports: z.array(siteImportSchema).min(1, m("addImport")),
});

export const commonRoleFormSchema = z.object({
  component: z.literal("commonrole"),
  name: z.string().min(1, m("nameRequired")),
  timezone: z.string().min(1, m("timezoneRequired")),
});

export const ansibleConfigFormSchema = z.object({
  component: z.literal("ansiblecfg"),
  name: z.string().min(1, m("nameRequired")),
  inventory: z.string().optional(),
  rolesPath: z.string().min(1, m("rolesPathRequired")),
});

export const roleFormSchema = z.object({
  component: z.literal("role"),
  name: z
    .string()
    .min(1, m("nameRequired"))
    .regex(/^[A-Za-z0-9_.-]+$/, m("roleNameFormat")),
  description: z.string().optional(),
});
