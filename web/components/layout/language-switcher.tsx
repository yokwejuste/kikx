"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, saveLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const t = useTranslations("header");
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (locale: Locale) => {
    if (locale === current) return;
    saveLocale(locale);
    startTransition(() => router.refresh());
  };

  return (
    <div role="group" aria-label={t("language")} className="flex items-center rounded-md border p-0.5">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          aria-label={t(`languages.${locale}`)}
          disabled={pending}
          onClick={() => choose(locale)}
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium uppercase transition-colors pointer-coarse:min-h-9 pointer-coarse:min-w-9",
            locale === current ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
