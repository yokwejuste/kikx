"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundIllustration } from "@/components/illustrations/illustrations";

async function fetchJoke(): Promise<string> {
  const response = await fetch("https://icanhazdadjoke.com/", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("joke fetch failed");
  const data = await response.json();
  return data.joke as string;
}

export default function NotFound() {
  const t = useTranslations("notFound");
  const [joke, setJoke] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchJoke()
      .then((j) => {
        if (!cancelled) setJoke(j);
      })
      .catch(() => {
        if (!cancelled) setJoke(t("jokeFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, t]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-2">
        <NotFoundIllustration className="mb-4 h-32" />
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{t.rich("title", { accent: (chunks) => <span className="text-brand">{chunks}</span> })}</h1>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <p className="text-balance">{joke}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setAttempt((n) => n + 1)} disabled={loading}>
          <RefreshCw className="size-4" />
          {t("another")}
        </Button>
        <Button asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </main>
  );
}
