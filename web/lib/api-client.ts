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

export interface ProjectSummary {
  name: string;
  defaultNamespace: string;
  outputDir: string;
}

export interface VendoredFile {
  fileName: string;
  component: string;
  name: string;
}

export interface ProjectState {
  exists: boolean;
  project: ProjectSummary | null;
  vendoredFiles: VendoredFile[];
}

export interface ComponentsResponse {
  components: string[];
}

export interface InitRequest {
  projectDir: string;
  name?: string;
  dir?: string;
  namespace?: string;
  force?: boolean;
}

export interface InitResponse {
  projectName: string;
  configPath: string;
  outputDir: string;
}

export interface Label {
  key: string;
  value: string;
}

export interface AddRequest {
  projectDir: string;
  component: string;
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
  force?: boolean;
}

export interface AddResponse {
  component: string;
  rendered: string;
  outputPath: string | null;
  written: boolean;
}

export const api = {
  listComponents: () => request<ComponentsResponse>("/api/components"),

  getProject: (dir: string) =>
    request<ProjectState>(`/api/project?dir=${encodeURIComponent(dir)}`),

  initProject: (body: InitRequest) =>
    request<InitResponse>("/api/project/init", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  previewComponent: (body: AddRequest) =>
    request<AddResponse>("/api/project/components/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addComponent: (body: AddRequest) =>
    request<AddResponse>("/api/project/components", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
