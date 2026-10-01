"use client";

import { Copy, type LucideIcon } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
import { IconButton } from "@/components/common/icon-button";
import { cn } from "@/lib/utils";

export function TerminalFrame({
  title,
  actions,
  className,
  children,
  ...props
}: {
  title?: string;
  actions?: React.ReactNode;
} & React.ComponentProps<"div">) {
  return (
    <div className={cn("terminal w-full overflow-hidden rounded-xl border text-left shadow-sm", className)} {...props}>
      <div className="flex shrink-0 items-center gap-1.5 border-b border-terminal-border py-1.5 pr-1.5 pl-4">
        <span className="size-2.5 rounded-full bg-terminal-dot" />
        <span className="size-2.5 rounded-full bg-terminal-dot" />
        <span className="size-2.5 rounded-full bg-volt" />
        {title && <span className="ml-2 truncate font-mono text-xs text-terminal-muted">{title}</span>}
        <span className="ml-auto flex min-h-7 items-center gap-1">{actions}</span>
      </div>
      {children}
    </div>
  );
}

export const terminalButtonClass =
  "size-7 shrink-0 text-terminal-muted hover:bg-terminal-hover hover:text-terminal-foreground dark:hover:bg-terminal-hover";

export function TerminalButton({ className, ...props }: Omit<React.ComponentProps<typeof IconButton>, "size">) {
  return <IconButton size="sm" className={cn(terminalButtonClass, className)} {...props} />;
}

export function TerminalCopyButton({
  text,
  label,
  icon: Icon = Copy,
  className,
  ...props
}: { label: string; icon?: LucideIcon } & Omit<React.ComponentProps<typeof CopyButton>, "children">) {
  return (
    <CopyButton
      text={text}
      size="icon"
      aria-label={label}
      title={label}
      className={cn(terminalButtonClass, className)}
      {...props}
    >
      <Icon className="size-3.5" />
    </CopyButton>
  );
}

export function PromptLine({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex gap-2", className)}>
      <span aria-hidden className="terminal-prompt select-none">
        $
      </span>
      {children}
    </div>
  );
}
