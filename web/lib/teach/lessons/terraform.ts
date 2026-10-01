import type { Lesson } from "../types.ts";
import { chapter, go, say } from "../steps.ts";

export const terraform: Lesson = {
  id: "terraform",
  level: "further",
  icon: "cloud",
  steps: [chapter("start"), go("/"), say("intro"), say("done")],
};
