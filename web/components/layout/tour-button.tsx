"use client";

import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_ROUTES } from "@/lib/tour/steps";
import { useStartTour } from "@/lib/tour/use-tour";

export function TourButton() {
  const tour = TOUR_ROUTES[usePathname()];
  const start = useStartTour(tour);

  if (!tour) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-tour="tour-button"
      className="gap-1.5 text-muted-foreground hover:text-foreground"
      aria-label="Take the tour"
      onClick={start}
    >
      <Compass className="size-4" />
      <span className="hidden sm:inline">Take the tour</span>
    </Button>
  );
}
