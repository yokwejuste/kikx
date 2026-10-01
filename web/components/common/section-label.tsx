import { cn } from "@/lib/utils";

export function SectionLabel({
  as: Element = "p",
  className,
  ...props
}: { as?: "p" | "span" | "div" | "h2" | "h3" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Element
      className={cn("text-xs font-semibold tracking-wide text-muted-foreground uppercase", className)}
      {...props}
    />
  );
}
