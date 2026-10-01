export type TourName = "home" | "builder";

export const TOUR_ROUTES: Record<string, TourName> = {
  "/": "home",
  "/build": "builder",
};

export const tourTarget = (id: string) => `[data-tour="${id}"]`;

export const TOURS: Record<TourName, string[]> = {
  home: ["welcome", "templates", "new-project", "open-preset", "cli", "data-flow", "tour-button"],
  builder: ["catalog", "editor", "checklist", "project", "views", "download"],
};
