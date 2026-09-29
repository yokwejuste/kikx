import { extractInventoryGroupNames } from "@/lib/ansible/inventory";
import {
  extractAvailableRoleNames,
  extractReferencedRoleNames,
  playbookPath,
  playsFromRecipe,
} from "@/lib/ansible/playbook";
import type { SiteImportValues } from "@/lib/forms/schemas";
import type { AddedComponent } from "@/lib/project/context";

/** What the rest of the project offers the component being edited, for suggestions and quick-adds. */
export interface FormContext {
  /** Group names from every Inventory in the project. */
  groupNames: string[];
  /** Role names worth suggesting: vendored roles plus roles other playbooks already use. */
  roleSuggestions: string[];
  /** Playbooks this project produces, for the site playbook's quick-add. */
  availablePlaybooks: SiteImportValues[];
  /** Service names, so an ingress can suggest its backend. */
  serviceNames: string[];
}

export function buildFormContext(components: AddedComponent[]): FormContext {
  const roles = new Set([...extractAvailableRoleNames(components), ...extractReferencedRoleNames(components)]);
  return {
    groupNames: extractInventoryGroupNames(components),
    roleSuggestions: Array.from(roles),
    availablePlaybooks: components
      .filter((c) => c.recipe.reference === "ansible/playbook")
      .map((c) => ({
        name: playsFromRecipe(c.recipe)[0]?.name || c.recipe.name,
        path: playbookPath(c.recipe.name, c.recipe.fields.folder),
      })),
    serviceNames: components.filter((c) => c.recipe.reference === "k8s/service").map((c) => c.recipe.name),
  };
}
