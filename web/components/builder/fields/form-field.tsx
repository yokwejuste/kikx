import { useId } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HelpTip } from "@/components/common/help-tip";
import type { GlossaryTerm } from "@/lib/glossary/terms";
import { Hint } from "@/components/common/hint";

export function FormField({
  label,
  error,
  description,
  help,
  registration,
  ...inputProps
}: {
  label: string;
  error?: { message?: string };
  description?: string;
  help?: GlossaryTerm;
  registration: UseFormRegisterReturn;
} & Omit<React.ComponentProps<"input">, "name" | "onChange" | "onBlur" | "ref">) {
  const inputId = useId();
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>
        {label}
        <HelpTip term={help} className="-my-1" />
      </FieldLabel>
      <Input id={inputId} data-teach={`field-${registration.name}`} aria-invalid={!!error} {...registration} {...inputProps} />
      {description && <Hint>{description}</Hint>}
      <FieldError errors={[error]} />
    </Field>
  );
}
