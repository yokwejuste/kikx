"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegistry } from "@/lib/registry/store";

/** Renders children once the backend registry and project defaults have loaded. */
export function RegistryGate({ children }: { children: React.ReactNode }) {
  const registry = useRegistry();

  if (registry.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Loading components…
      </main>
    );
  }

  if (registry.isError) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium">Can&apos;t reach the kikx backend</p>
        <p className="max-w-md text-sm text-muted-foreground">{registry.error.message}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => registry.refetch()}>
          Try again
        </Button>
      </main>
    );
  }

  return <>{children}</>;
}
