import { cn } from "@/lib/utils";

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-1 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
      />
    </div>
  );
}
