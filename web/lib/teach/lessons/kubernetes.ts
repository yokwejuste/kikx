import type { Lesson } from "../types.ts";
import { chapter, go, say } from "../steps.ts";

export const kubernetes: Lesson = {
  id: "kubernetes",
  level: "further",
  icon: "kubernetes",
  steps: [chapter("start"), go("/"), say("intro"), say("done")],
};
