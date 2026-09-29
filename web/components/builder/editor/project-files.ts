import type { RenderResponse } from "@/lib/api/client";
import type { ProjectFile } from "@/lib/project/context";

export function toProjectFiles(data: RenderResponse): ProjectFile[] {
  return data.files.map((f) => ({ fileName: f.path, component: data.component, content: f.content }));
}
