"use client";

import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  ...props
}: { text: string | (() => string) } & Omit<React.ComponentProps<typeof Button>, "type" | "onClick">) {
  const t = useTranslations("common");
  return (
    <Button
      variant="ghost"
      onClick={() => {
        navigator.clipboard.writeText(typeof text === "function" ? text() : text);
        toast.success(t("copied"));
      }}
      {...props}
    />
  );
}
