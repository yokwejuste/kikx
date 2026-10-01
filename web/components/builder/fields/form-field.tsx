import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HelpTip } from "@/components/common/help-tip";
import type { GlossaryTerm } from "@/lib/glossary/terms";

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
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        {label}
        <HelpTip term={help} className="-my-1" />
      </FieldLabel>
      <Input aria-invalid={!!error} {...registration} {...inputProps} />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <FieldError errors={[error]} />
    </Field>
  );
}
