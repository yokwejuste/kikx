import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function RowInput({
  label,
  invalid,
  mono,
  registration,
  className,
  ...props
}: {
  label?: string;
  invalid?: boolean;
  mono?: boolean;
  registration: UseFormRegisterReturn;
} & Omit<React.ComponentProps<"input">, "name" | "onChange" | "onBlur" | "ref" | "aria-label" | "aria-invalid">) {
  return (
    <Input
      aria-label={label}
      aria-invalid={invalid}
      className={cn(mono && "font-mono", className)}
      {...props}
      {...registration}
    />
  );
}
