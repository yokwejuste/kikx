"use client";

import { useTranslations } from "next-intl";
import { FieldError } from "@/components/ui/field";
import type { KeyValueProblem } from "@/lib/format/key-value";

export function KeyValueProblems({ problems, className }: { problems: (KeyValueProblem | null)[]; className?: string }) {
  const t = useTranslations("formatting.keyValue");
  const errors = problems.flatMap((problem) => (problem ? [{ message: t(problem.kind, problem) }] : []));
  return <FieldError className={className ?? "text-xs"} errors={errors} />;
}
