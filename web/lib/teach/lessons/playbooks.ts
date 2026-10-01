import type { Lesson } from "../types.ts";
import { chapter, go, say } from "../steps.ts";

export const playbooks: Lesson = {
  id: "playbooks",
  level: "further",
  icon: "playbook",
  steps: [chapter("start"), go("/"), say("intro"), say("done")],
};
