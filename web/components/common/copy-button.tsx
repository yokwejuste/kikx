"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  ...props
}: { text: string } & Omit<React.ComponentProps<typeof Button>, "type" | "onClick">) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
      {...props}
    />
  );
}
