"use client";

import { useState } from "react";
import { useProject, type FileConflict, type ProjectFile } from "@/lib/project/context";
import type { PresetComponent } from "@/lib/project/preset";

type Pending = { recipe: PresetComponent; files: ProjectFile[]; conflicts: FileConflict[] };

export function useConflictGuard(commit: (recipe: PresetComponent, files: ProjectFile[]) => void, ignoreId?: string) {
  const { findConflicts } = useProject();
  const [pending, setPending] = useState<Pending | null>(null);

  const save = (recipe: PresetComponent, files: ProjectFile[]) => {
    const conflicts = findConflicts(files, ignoreId);
    if (conflicts.length > 0) setPending({ recipe, files, conflicts });
    else commit(recipe, files);
  };

  const dialogProps = {
    conflicts: pending?.conflicts ?? null,
    onCancel: () => setPending(null),
    onConfirm: () => {
      if (pending) commit(pending.recipe, pending.files);
      setPending(null);
    },
  };

  return { save, dialogProps };
}
