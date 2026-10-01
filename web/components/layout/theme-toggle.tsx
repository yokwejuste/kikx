"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/common/icon-button";
import { useColorMode } from "@/lib/theme/use-color-mode";

export function ThemeToggle() {
  const t = useTranslations("header");
  const { setTheme } = useTheme();
  const mode = useColorMode();

  return (
    <IconButton
      icon={mode === "dark" ? Sun : Moon}
      label={t("theme")}
      onClick={() => setTheme(mode === "dark" ? "light" : "dark")}
    />
  );
}
