import { z } from "zod";

export const projectDirSchema = z
  .string()
  .min(1, "Enter a project directory")
  .refine((v) => v.startsWith("/"), "Must be an absolute path (starting with /)");

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

// z.coerce.number() turns an empty string (an untouched optional numeric
// input) into 0, which then fails .min(1) — preprocess blank/undefined to
// undefined first so "optional" numeric fields can actually be left blank.
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

export const componentFormSchema = z.discriminatedUnion("component", [
  deploymentFormSchema,
  serviceFormSchema,
  ingressFormSchema,
]);

export type ComponentFormValues = z.infer<typeof componentFormSchema>;
export type ComponentKind = ComponentFormValues["component"];
