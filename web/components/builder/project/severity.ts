import { CircleAlert, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { IssueSeverity } from "@/lib/project/checks";

export type IssueCounts = Record<IssueSeverity, number>;

export const SEVERITY: Record<IssueSeverity, { icon: LucideIcon; className: string }> = {
  error: { icon: CircleAlert, className: "text-destructive" },
  warning: { icon: TriangleAlert, className: "text-foreground" },
  info: { icon: Info, className: "text-muted-foreground" },
};
