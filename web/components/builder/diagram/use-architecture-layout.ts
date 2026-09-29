import { useEffect, useState } from "react";
import { layoutArchitecture, type ArchitectureLayout } from "@/lib/architecture/layout";
import type { ArchitectureGraph } from "@/lib/architecture/graph";

export function useArchitectureLayout(graph: ArchitectureGraph) {
  const [layout, setLayout] = useState<ArchitectureLayout | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    layoutArchitecture(graph)
      .then((next) => {
        if (cancelled) return;
        setLayout(next);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [graph]);

  return { layout, failed };
}
