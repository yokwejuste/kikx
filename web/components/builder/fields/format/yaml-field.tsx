"use client";

import { lazy, Suspense } from "react";
import { useController, type UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import type { FormValues } from "@/lib/forms/component-forms";
import { cn } from "@/lib/utils";

const YamlEditor = lazy(() => import("@/components/builder/fields/format/yaml-editor"));

const FRAME =
  "flex w-full rounded-lg border border-input bg-transparent font-mono text-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid=true]:border-destructive data-[invalid=true]:ring-3 data-[invalid=true]:ring-destructive/20 dark:bg-input/30 dark:data-[invalid=true]:border-destructive/50";

export interface YamlEditorProps {
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  focusRef: (target: { focus: () => void }) => void;
  label: string;
  placeholder?: string;
  teach?: string;
  invalid?: boolean;
  frameClassName: string;
}

export function YamlField({
  form,
  name,
  label,
  placeholder,
  teach,
  invalid,
  className,
}: {
  form: UseFormReturn<FormValues>;
  name: string;
  label: string;
  placeholder?: string;
  teach?: string;
  invalid?: boolean;
  className?: string;
}) {
  const { field } = useController({ control: form.control, name: name as never });
  const value = (field.value as unknown as string | undefined) ?? "";
  const frameClassName = cn(FRAME, className);

  return (
    <Suspense
      fallback={
        <Textarea
          readOnly
          aria-label={label}
          value={value}
          placeholder={placeholder}
          className={cn("font-mono text-xs", className)}
        />
      }
    >
      <YamlEditor
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        focusRef={field.ref}
        label={label}
        placeholder={placeholder}
        teach={teach}
        invalid={invalid}
        frameClassName={frameClassName}
      />
    </Suspense>
  );
}
