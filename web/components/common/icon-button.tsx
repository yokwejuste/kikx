import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "icon-xs",
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
} as const;

export type IconButtonSize = keyof typeof SIZES;

export function IconButton({
  icon: Icon,
  label,
  size = "md",
  variant = "ghost",
  className,
  children,
  ...props
}: {
  icon?: LucideIcon;
  label: string;
  size?: IconButtonSize;
} & Omit<React.ComponentProps<typeof Button>, "size" | "aria-label" | "title">) {
  return (
    <Button
      variant={variant}
      size={SIZES[size]}
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      {Icon ? <Icon /> : children}
    </Button>
  );
}
