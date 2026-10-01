import { cn } from "@/lib/utils";

export function Hint({
  as: Element = "p",
  className,
  ...props
}: { as?: "p" | "span" | "div" | "h3" } & React.HTMLAttributes<HTMLElement>) {
  return <Element className={cn("text-xs text-muted-foreground", className)} {...props} />;
}
