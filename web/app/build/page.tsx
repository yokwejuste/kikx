"use client";

import Link from "next/link";
import { useProject } from "@/lib/project/context";
import { Dashboard } from "@/components/builder/dashboard";
import { RegistryGate } from "@/components/layout/registry-gate";

export default function BuildPage() {
  const { details } = useProject();

  if (!details) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted-foreground">No project details yet.</p>
        <Link href="/" className="text-sm underline underline-offset-4">
          Go back and fill them in
        </Link>
      </main>
    );
  }

  return (
    <RegistryGate>
      <Dashboard />
    </RegistryGate>
  );
}
