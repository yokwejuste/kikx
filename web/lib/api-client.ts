const API_URL = process.env.NEXT_PUBLIC_KIKX_API_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      body?.code ?? "unknown",
      body?.error ?? `Request to ${path} failed with status ${response.status}`,
    );
  }

  return body as T;
}

export interface ComponentsResponse {
  components: string[];
}

export interface Label {
  key: string;
  value: string;
}

export interface RenderRequest {
  reference: string;
  name: string;
  image?: string;
  replicas?: number;
  port?: number;
  targetPort?: number;
  namespace?: string;
  host?: string;
  path?: string;
  service?: string;
  labels?: Label[];
  fields?: Record<string, string>;
  defaultNamespace?: string;
}

export interface RenderResponse {
  component: string;
  extension: string;
  rendered: string;
}

export interface FieldSpec {
  name: string;
  required: boolean;
  default: string | null;
}

export interface RegistryItem {
  name: string;
  category: string;
  extension: string;
  title: string;
  description: string;
  fields: FieldSpec[];
}

export interface PublishProjectRequest {
  details: { name: string; namespace: string; outputDir: string };
  files: { fileName: string; component: string; content: string }[];
}

export interface PublishProjectResponse {
  id: string;
}

export function setupCommandFor(id: string): string {
  return `kikx setup ${API_URL}/api/project/${id}`;
}

export const api = {
  listComponents: () => request<ComponentsResponse>("/api/components"),

  render: (body: RenderRequest) =>
    request<RenderResponse>("/api/render", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  inspectRegistryItem: (reference: string) =>
    request<RegistryItem>(`/api/registry/inspect?ref=${encodeURIComponent(reference)}`),

  publishProject: (body: PublishProjectRequest) =>
    request<PublishProjectResponse>("/api/project", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
