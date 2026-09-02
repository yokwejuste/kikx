import Link from "next/link";
import { Waypoints } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        kikx
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/flow"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Waypoints className="size-4" />
          Data flow
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
