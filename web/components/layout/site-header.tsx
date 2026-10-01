import Link from "next/link";
import { BookOpen, Waypoints } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { docsHref } from "@/lib/i18n/docs";
import { KikxMark } from "@/components/common/kikx-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TourButton } from "@/components/layout/tour-button";
import { TeachButton } from "@/components/teach/teach-button";
import { GithubLink } from "@/components/layout/github-link";
import { NavLink } from "@/components/layout/nav-link";

export async function SiteHeader() {
  const t = await getTranslations("header");
  const locale = await getLocale();
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 sm:px-6">
      <Link href="/" aria-label={t("home")} className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <KikxMark className="size-5" />
        <span className="hidden sm:inline">kikx</span>
      </Link>
      <nav className="flex items-center gap-0.5 sm:gap-1">
        <a
          href={docsHref("index", locale)}
          aria-label={t("docs")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:px-3 pointer-coarse:min-h-10"
        >
          <BookOpen className="size-4" />
          <span className="hidden sm:inline">{t("docs")}</span>
        </a>
        <NavLink
          href="/flow"
          data-tour="data-flow"
          aria-label={t("dataFlow")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm sm:px-3 pointer-coarse:min-h-10"
        >
          <Waypoints className="size-4" />
          <span className="hidden sm:inline">{t("dataFlow")}</span>
        </NavLink>
        <TeachButton />
        <TourButton />
        <GithubLink />
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>
    </header>
  );
}
