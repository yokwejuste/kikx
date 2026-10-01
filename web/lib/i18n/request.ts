import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, localeFromAcceptLanguage, LOCALE_COOKIE } from "@/lib/i18n/config";
import { LESSONS } from "@/lib/teach/lessons/index.ts";

async function lessonMessages(locale: string) {
  const entries = await Promise.all(
    LESSONS.map(async ({ id }) => [id, (await import(`../../messages/lessons/${locale}/${id}.json`)).default] as const),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async () => {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : localeFromAcceptLanguage((await headers()).get("accept-language"));
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return {
    locale,
    messages: { ...messages, teach: { ...messages.teach, lessons: await lessonMessages(locale) } },
  };
});
