import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RemoveButton({
  className,
  size = "icon",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type" | "variant" | "children">) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={cn("text-muted-foreground hover:text-destructive", className)}
      {...props}
    >
      <X />
    </Button>
  );
}

export function RowActions({
  index,
  count,
  labels,
  canRemove = true,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  labels: { up: string; down: string; remove: string };
  canRemove?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.up}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.down}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown />
      </Button>
      <RemoveButton size="icon-sm" aria-label={labels.remove} disabled={!canRemove} onClick={onRemove} />
    </div>
  );
}
