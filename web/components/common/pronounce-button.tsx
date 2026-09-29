"use client";

import { Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePronounce, useSpeechSupported } from "@/lib/pronounce/use-pronounce";

export function PronounceButton() {
  const t = useTranslations("home.pronounce");
  const supported = useSpeechSupported();
  const pronounce = usePronounce();

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t("label")}
      title={t("hint")}
      onClick={pronounce}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Volume2 className="size-4" />
      <span className="text-xs">{t("hint")}</span>
    </Button>
  );
}
