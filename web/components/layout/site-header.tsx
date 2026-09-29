import Link from "next/link";
import { Waypoints } from "lucide-react";
import { KikxMark } from "@/components/common/kikx-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TourButton } from "@/components/layout/tour-button";

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <KikxMark className="size-5" />
        kikx
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/flow"
          data-tour="data-flow"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Waypoints className="size-4" />
          Data flow
        </Link>
        <TourButton />
        <ThemeToggle />
      </nav>
    </header>
  );
}
