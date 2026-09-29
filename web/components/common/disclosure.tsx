import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  divider: { details: "border-t", summary: "px-3", hint: "truncate" },
  dashed: { details: "rounded-md border border-dashed", summary: "px-2.5", hint: "" },
};

export function Disclosure({
  title,
  hint,
  variant = "divider",
  children,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
}) {
  const styles = VARIANTS[variant];
  return (
    <details className={cn("group/disclosure", styles.details)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-xs text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden",
          styles.summary,
        )}
      >
        <ChevronRight className="size-3.5 transition-transform group-open/disclosure:rotate-90" />
        {title}
        {hint && <span className={cn("text-muted-foreground/80", styles.hint)}>— {hint}</span>}
      </summary>
      {children}
    </details>
  );
}
