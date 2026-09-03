import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function FormField({
  label,
  error,
  description,
  registration,
  ...inputProps
}: {
  label: string;
  error?: { message?: string };
  description?: string;
  registration: UseFormRegisterReturn;
} & Omit<React.ComponentProps<"input">, "name" | "onChange" | "onBlur" | "ref">) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      <Input aria-invalid={!!error} {...registration} {...inputProps} />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <FieldError errors={[error]} />
    </Field>
  );
}
