"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRegistry } from "@/lib/registry/store";
import { useErrorText } from "@/lib/i18n/use-error-text";

export function RegistryGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("registryGate");
  const errorText = useErrorText();
  const registry = useRegistry();

  if (registry.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        {t("loading")}
      </main>
    );
  }

  if (registry.isError) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium">{t("unreachable")}</p>
        <p className="max-w-md text-sm text-muted-foreground">{errorText(registry.error, "errors.network")}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => registry.refetch()}>
          {t("retry")}
        </Button>
      </main>
    );
  }

  return <>{children}</>;
}
