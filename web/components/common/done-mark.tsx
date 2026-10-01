import { Circle, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function DoneMark({ done, className }: { done: boolean; className?: string }) {
  const Icon = done ? CircleCheck : Circle;
  return <Icon aria-hidden className={cn("size-4 shrink-0", done ? "text-brand" : "text-muted-foreground", className)} />;
}
