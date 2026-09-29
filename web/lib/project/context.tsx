"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { PresetComponent } from "@/lib/project/preset";
import { clearStoredProject, loadStoredProject, saveStoredProject } from "@/lib/project/storage";

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

export interface FileConflict {
  fileName: string;
  owner: AddedComponent;
  existingContent: string;
  incomingContent: string;
}

export interface RemovedComponent {
  component: AddedComponent;
  index: number;
}

interface ProjectContextValue {
  details: ProjectDetails | null;
  setDetails: (details: ProjectDetails) => void;
  components: AddedComponent[];
  saveComponent: (recipe: PresetComponent, files: ProjectFile[], replacingId?: string) => string[];
  removeComponent: (id: string) => RemovedComponent | null;
  restoreComponent: (removed: RemovedComponent) => void;
  findConflicts: (files: ProjectFile[], ignoreId?: string) => FileConflict[];
  loadProject: (details: ProjectDetails, components: AddedComponent[]) => void;
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

  const findConflicts = useCallback(
    (files: ProjectFile[], ignoreId?: string) => {
      const conflicts: FileConflict[] = [];
      for (const file of files) {
        for (const owner of components) {
          if (owner.id === ignoreId) continue;
          const existing = owner.files.find((f) => f.fileName === file.fileName);
          if (existing) {
            conflicts.push({
              fileName: file.fileName,
              owner,
              existingContent: existing.content,
              incomingContent: file.content,
            });
          }
        }
      }
      return conflicts;
    },
    [components],
  );

  const saveComponent = useCallback(
    (recipe: PresetComponent, files: ProjectFile[], replacingId?: string) => {
      const id = componentId(recipe);
      const incoming = new Set(files.map((f) => f.fileName));
      const displaced = components
        .filter((c) => c.id !== replacingId && (c.id === id || c.files.some((f) => incoming.has(f.fileName))))
        .map((c) => c.id);
      const dropped = new Set([...displaced, ...(replacingId ? [replacingId] : [])]);

      setComponents((prev) => {
        const anchor = prev.findIndex((c) => c.id === (replacingId ?? id));
        const next = prev.filter((c) => !dropped.has(c.id));
        const entry = { id, recipe, files };
        if (anchor === -1) {
          next.push(entry);
        } else {
          const droppedBefore = prev.slice(0, anchor).filter((c) => dropped.has(c.id)).length;
          next.splice(anchor - droppedBefore, 0, entry);
        }
        return next;
      });
      return displaced.filter((d) => d !== id);
    },
    [components],
  );

  const removeComponent = useCallback(
    (id: string) => {
      const index = components.findIndex((c) => c.id === id);
      if (index === -1) return null;
      setComponents((prev) => prev.filter((c) => c.id !== id));
      return { component: components[index], index };
    },
    [components],
  );

  const restoreComponent = useCallback((removed: RemovedComponent) => {
    setComponents((prev) => {
      if (prev.some((c) => c.id === removed.component.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(removed.index, next.length), 0, removed.component);
      return next;
    });
  }, []);

  const loadProject = useCallback((nextDetails: ProjectDetails, nextComponents: AddedComponent[]) => {
    setDetails(nextDetails);
    setComponents(nextComponents);
  }, []);

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
        saveComponent,
        removeComponent,
        restoreComponent,
        findConflicts,
        loadProject,
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
