import type { Lesson } from "../types.ts";
import { chapter, go, say } from "../steps.ts";

export const importExisting: Lesson = {
  id: "import",
  level: "basics",
  icon: "import",
  steps: [chapter("start"), go("/"), say("intro"), say("done")],
};
