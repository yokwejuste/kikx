import type { Lesson } from "../types.ts";
import { chapter, go, say } from "../steps.ts";

export const checks: Lesson = {
  id: "checks",
  level: "further",
  icon: "checks",
  steps: [chapter("start"), go("/"), say("intro"), say("done")],
};
