export const LOCALES = ["en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localeFromAcceptLanguage(header: string | null): Locale {
  const preferred = (header ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase().slice(0, 2));
  return preferred.find((language) => isLocale(language)) ?? DEFAULT_LOCALE;
}

export function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}
