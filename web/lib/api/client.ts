const API_URL = process.env.NEXT_PUBLIC_KIKX_API_URL;

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
  if (!API_URL) {
    throw new ApiClientError(
      0,
      "not_configured",
      "NEXT_PUBLIC_KIKX_API_URL is not set — point it at your kikx backend (see web/.env.example).",
    );
  }
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

interface Label {
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

export interface RenderedFile {
  path: string;
  content: string;
}

export interface RenderResponse {
  component: string;
  files: RenderedFile[];
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  name: string;
  required: boolean;
  default: string | null;
  description?: string | null;
  example?: string | null;
  options?: FieldOption[];
}

export interface RegistryItem {
  name: string;
  category: string;
  title: string;
  description: string;
  fields: FieldSpec[];
  reference?: string;
  files?: string[];
}

interface RegistryResponse {
  items: RegistryItem[];
}

export interface ProjectDefaults {
  defaultNamespace: string;
  defaultOutputDir: string;
  defaultProjectName: string;
}

export interface PresetSummary {
  name: string;
  title: string;
  description: string;
  componentCount: number;
}

export const api = {
  registry: () => request<RegistryResponse>("/api/registry"),

  presets: () => request<{ presets: PresetSummary[] }>("/api/presets").then((body) => body.presets),

  preset: (name: string) => request<unknown>(`/api/presets/${encodeURIComponent(name)}`),

  config: () => request<ProjectDefaults>("/api/config"),

  render: (body: RenderRequest) =>
    request<RenderResponse>("/api/render", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  inspectRegistryItem: (reference: string) =>
    request<RegistryItem>(`/api/registry/inspect?ref=${encodeURIComponent(reference)}`),
};
