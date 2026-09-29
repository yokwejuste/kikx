import { cn } from "@/lib/utils";

export function EmptyState({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
