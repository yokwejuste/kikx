import JSZip from "jszip";
import { downloadBlob } from "@/lib/download";
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";

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

  downloadBlob(await zip.generateAsync({ type: "blob" }), `${details.name || "kikx-project"}.zip`);
}
