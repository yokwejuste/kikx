import { extractInventoryGroupNames } from "@/lib/ansible/inventory";
import {
  extractAvailableRoleNames,
  extractReferencedRoleNames,
  playbookPath,
  playsFromRecipe,
} from "@/lib/ansible/playbook";
import type { SiteImportValues } from "@/lib/forms/schemas";
import type { AddedComponent } from "@/lib/project/context";

export interface FormContext {
  groupNames: string[];
  roleSuggestions: string[];
  availablePlaybooks: SiteImportValues[];
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
