"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, className, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        className,
        active ? "bg-volt-soft text-volt-soft-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      {...props}
    />
  );
}
