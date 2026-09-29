import { CircleAlert, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { IssueSeverity } from "@/lib/project/checks";

export type IssueCounts = Record<IssueSeverity, number>;

export const SEVERITY: Record<IssueSeverity, { label: string; icon: LucideIcon; className: string }> = {
  error: { label: "Errors", icon: CircleAlert, className: "text-destructive" },
  warning: { label: "Warnings", icon: TriangleAlert, className: "text-foreground" },
  info: { label: "Notes", icon: Info, className: "text-muted-foreground" },
};
