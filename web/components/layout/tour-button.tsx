"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TOUR_ROUTES } from "@/lib/tour/steps";
import { closeTour, useStartTour } from "@/lib/tour/use-tour";

export function TourButton() {
  const t = useTranslations("header");
  const pathname = usePathname();
  const tour = TOUR_ROUTES[pathname];
  const start = useStartTour(tour);

  useEffect(() => closeTour, [pathname]);

  if (!tour) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-tour="tour-button"
      className="gap-1.5 text-muted-foreground hover:text-foreground"
      aria-label={t("tour")}
      onClick={start}
    >
      <Compass className="size-4" />
      <span className="hidden md:inline">{t("tour")}</span>
    </Button>
  );
}
