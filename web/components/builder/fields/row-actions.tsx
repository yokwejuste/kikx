import { ArrowDown, ArrowUp, X } from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { cn } from "@/lib/utils";

export function RemoveButton({
  className,
  ...props
}: Omit<React.ComponentProps<typeof IconButton>, "icon" | "variant" | "children">) {
  return <IconButton icon={X} className={cn("hover:text-destructive", className)} {...props} />;
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
      <IconButton icon={ArrowUp} size="sm" label={labels.up} disabled={index === 0} onClick={() => onMove(index, index - 1)} />
      <IconButton
        icon={ArrowDown}
        size="sm"
        label={labels.down}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      />
      <RemoveButton size="sm" label={labels.remove} disabled={!canRemove} onClick={onRemove} />
    </div>
  );
}
