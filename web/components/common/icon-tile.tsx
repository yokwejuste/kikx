import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tile = cva("flex shrink-0 items-center justify-center bg-volt-soft text-volt-soft-foreground", {
  variants: {
    size: {
      sm: "size-6 rounded-md [&_svg]:size-3.5",
      md: "size-8 rounded-lg [&_svg]:size-4",
      lg: "size-9 rounded-lg [&_svg]:size-4",
    },
  },
  defaultVariants: { size: "md" },
});

export function IconTile({
  icon: Icon,
  size,
  className,
  iconClassName,
}: { icon: LucideIcon; className?: string; iconClassName?: string } & VariantProps<typeof tile>) {
  return (
    <span aria-hidden className={cn(tile({ size }), className)}>
      <Icon className={iconClassName} />
    </span>
  );
}
