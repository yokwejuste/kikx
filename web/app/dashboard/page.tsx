"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";

function DashboardContent() {
  const searchParams = useSearchParams();
  const dir = searchParams.get("dir");

  if (!dir) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">
          No project directory given. Go back and enter one.
        </p>
      </main>
    );
  }

  return <Dashboard dir={dir} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
