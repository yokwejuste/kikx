"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmPrompt({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  children,
}: {
  title: string;
  body: React.ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    cancelRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={rootRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="flex w-full flex-wrap items-center justify-between gap-3"
    >
      <span>
        <span id={titleId} className="font-medium">{title}</span>
        <span id={bodyId} className="block text-muted-foreground">{body}</span>
      </span>
      <span className="flex flex-wrap gap-2">
        <Button ref={cancelRef} variant="ghost" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        {children}
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </span>
    </div>
  );
}
