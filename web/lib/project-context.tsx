"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { PresetComponent } from "@/lib/preset";
import { clearStoredProject, loadStoredProject, saveStoredProject } from "@/lib/project-storage";

export interface ProjectDetails {
  name: string;
  namespace: string;
  outputDir: string;
}

export interface ProjectFile {
  fileName: string;
  component: string;
  content: string;
}

export interface AddedComponent {
  id: string;
  recipe: PresetComponent;
  files: ProjectFile[];
}

interface ProjectContextValue {
  details: ProjectDetails | null;
  setDetails: (details: ProjectDetails) => void;
  components: AddedComponent[];
  addComponent: (recipe: PresetComponent, files: ProjectFile[]) => void;
  removeComponent: (id: string) => void;
  conflictingFileNames: (files: ProjectFile[]) => string[];
  reset: () => void;
}

export function componentId(recipe: PresetComponent): string {
  return `${recipe.reference}:${recipe.name}`;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [components, setComponents] = useState<AddedComponent[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      const stored = loadStoredProject();
      if (stored) {
        setDetails(stored.details);
        setComponents(stored.components);
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveStoredProject({ details, components });
  }, [details, components]);

  const addComponent = useCallback((recipe: PresetComponent, files: ProjectFile[]) => {
    const id = componentId(recipe);
    setComponents((prev) => {
      const next = prev.filter((c) => c.id !== id);
      next.push({ id, recipe, files });
      next.sort((a, b) => a.id.localeCompare(b.id));
      return next;
    });
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const conflictingFileNames = useCallback(
    (files: ProjectFile[]) => {
      const existing = new Set(components.flatMap((c) => c.files.map((f) => f.fileName)));
      return files.map((f) => f.fileName).filter((name) => existing.has(name));
    },
    [components],
  );

  const reset = useCallback(() => {
    setDetails(null);
    setComponents([]);
    clearStoredProject();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        details,
        setDetails,
        components,
        addComponent,
        removeComponent,
        conflictingFileNames,
        reset,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
}
