"use client";

import { createContext, useCallback, useContext, useState } from "react";

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

interface ProjectContextValue {
  details: ProjectDetails | null;
  setDetails: (details: ProjectDetails) => void;
  files: ProjectFile[];
  addFile: (file: ProjectFile) => void;
  removeFile: (fileName: string) => void;
  hasFile: (fileName: string) => boolean;
  reset: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);

  const addFile = useCallback((file: ProjectFile) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.fileName !== file.fileName);
      next.push(file);
      next.sort((a, b) => a.fileName.localeCompare(b.fileName));
      return next;
    });
  }, []);

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.fileName !== fileName));
  }, []);

  const hasFile = useCallback(
    (fileName: string) => files.some((f) => f.fileName === fileName),
    [files],
  );

  const reset = useCallback(() => {
    setDetails(null);
    setFiles([]);
  }, []);

  return (
    <ProjectContext.Provider
      value={{ details, setDetails, files, addFile, removeFile, hasFile, reset }}
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
