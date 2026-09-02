import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function FormField({
  label,
  error,
  registration,
  ...inputProps
}: {
  label: string;
  error?: { message?: string };
  registration: UseFormRegisterReturn;
} & Omit<React.ComponentProps<"input">, "name" | "onChange" | "onBlur" | "ref">) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      <Input {...registration} {...inputProps} />
      <FieldError errors={[error]} />
    </Field>
  );
}
