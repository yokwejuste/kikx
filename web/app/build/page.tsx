"use client";

import Link from "next/link";
import { useProject } from "@/lib/project/context";
import { Dashboard } from "@/components/builder/dashboard";
import { RegistryGate } from "@/components/layout/registry-gate";
import { PhoneWarning } from "@/components/builder/phone-warning";
import { useTranslations } from "next-intl";

export default function BuildPage() {
  const t = useTranslations("builder");
  const { details } = useProject();

  if (!details) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted-foreground">{t("noDetails")}</p>
        <Link href="/" className="text-sm underline underline-offset-4">
          {t("goBack")}
        </Link>
      </main>
    );
  }

  return (
    <RegistryGate>
      <PhoneWarning />
      <Dashboard />
    </RegistryGate>
  );
}
