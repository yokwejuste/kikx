import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export function docsHref(page: string, locale: string): string {
  const prefix = locale === DEFAULT_LOCALE ? "" : `${locale}/`;
  return `/docs/${prefix}${page}.html`;
}
