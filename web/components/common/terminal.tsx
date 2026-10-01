"use client";

import { Copy } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
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
      <div className="flex shrink-0 items-center gap-1.5 border-b border-(--terminal-paper)/10 py-1.5 pr-1.5 pl-4">
        <span className="size-2.5 rounded-full bg-(--terminal-paper)/20" />
        <span className="size-2.5 rounded-full bg-(--terminal-paper)/20" />
        <span className="size-2.5 rounded-full bg-volt" />
        {title && <span className="ml-2 truncate font-mono text-xs text-(--terminal-paper)/60">{title}</span>}
        <span className="ml-auto flex min-h-7 items-center gap-1">{actions}</span>
      </div>
      {children}
    </div>
  );
}

export const terminalButtonClass =
  "size-7 shrink-0 text-(--terminal-paper)/60 hover:bg-(--terminal-paper)/10 hover:text-(--terminal-paper) dark:hover:bg-(--terminal-paper)/10";

export function TerminalCopyButton({
  text,
  label,
  className,
  ...props
}: { text: string; label: string } & Omit<React.ComponentProps<typeof CopyButton>, "text" | "children">) {
  return (
    <CopyButton
      text={text}
      size="icon"
      aria-label={label}
      title={label}
      className={cn(terminalButtonClass, className)}
      {...props}
    >
      <Copy className="size-3.5" />
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
