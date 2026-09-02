import JSZip from "jszip";
import type { AddedComponent, ProjectDetails } from "@/lib/project-context";

function buildKikxToml(details: ProjectDetails): string {
  return `[project]\nname = "${details.name}"\ndefault_namespace = "${details.namespace}"\noutput_dir = "${details.outputDir}"\n`;
}

export async function downloadProjectZip(details: ProjectDetails, components: AddedComponent[]) {
  const zip = new JSZip();
  zip.file("kikx.toml", buildKikxToml(details));
  const outputFolder = zip.folder(details.outputDir) ?? zip;
  for (const component of components) {
    for (const file of component.files) {
      outputFolder.file(file.fileName, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${details.name || "kikx-project"}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
