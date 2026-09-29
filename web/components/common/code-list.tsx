import { cn } from "@/lib/utils";

export function CodeList({ items, className }: { items: string[]; className?: string }) {
  return items.map((item, i) => (
    <span key={item}>
      {i > 0 && ", "}
      <code className={cn("font-mono", className)}>{item}</code>
    </span>
  ));
}
