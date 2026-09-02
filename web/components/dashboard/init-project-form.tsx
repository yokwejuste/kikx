"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { api, ApiClientError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { initFormSchema, type InitFormValues } from "@/lib/schemas";

export function InitProjectForm({ dir }: { dir: string }) {
  const queryClient = useQueryClient();
  const form = useForm<InitFormValues>({
    resolver: zodResolver(initFormSchema),
    defaultValues: {
      name: dir.split("/").filter(Boolean).pop() ?? "my-project",
      namespace: "default",
      dir: "k8s",
    },
  });

  const initMutation = useMutation({
    mutationFn: (values: InitFormValues) =>
      api.initProject({ projectDir: dir, ...values }),
    onSuccess: (data) => {
      toast.success(`Initialized project "${data.projectName}"`);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(dir) });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to initialize project");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initialize project</CardTitle>
        <CardDescription>
          No kikx project found at <code className="break-all">{dir}</code>. Set one up.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit((values) => initMutation.mutate(values))}>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="init-name">Project name</FieldLabel>
              <Input id="init-name" {...form.register("name")} />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.namespace}>
              <FieldLabel htmlFor="init-namespace">Default namespace</FieldLabel>
              <Input id="init-namespace" {...form.register("namespace")} />
              <FieldError errors={[form.formState.errors.namespace]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.dir}>
              <FieldLabel htmlFor="init-dir">Output directory</FieldLabel>
              <Input id="init-dir" {...form.register("dir")} />
              <FieldError errors={[form.formState.errors.dir]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={initMutation.isPending}>
            {initMutation.isPending ? "Initializing…" : "Initialize"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
