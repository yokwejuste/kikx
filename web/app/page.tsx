"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/dashboard/form-field";
import { useProject } from "@/lib/project-context";
import { initFormSchema, type InitFormValues } from "@/lib/schemas";

const SNIPPET = [
  { cmd: "kikx init --name my-app" },
  { cmd: "kikx add k8s/deployment --name web --image nginx:1.27" },
  { cmd: "kikx add k8s/service --name web" },
];

export default function Home() {
  const router = useRouter();
  const { setDetails, reset } = useProject();
  const form = useForm<InitFormValues>({
    resolver: zodResolver(initFormSchema),
    defaultValues: { name: "", namespace: "default", dir: "k8s" },
  });

  function onSubmit(values: InitFormValues) {
    reset();
    setDetails({ name: values.name, namespace: values.namespace, outputDir: values.dir });
    router.push("/build");
  }

  return (
    <main className="relative flex flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-semibold tracking-tight text-balance">kikx</h1>
          <p className="max-w-md text-balance text-muted-foreground">
            Render real, editable Kubernetes manifests straight into your project.
            No hidden dependency, no generated black box — just plain YAML you own.
          </p>
        </div>

        <div className="w-full overflow-hidden rounded-xl border bg-card text-left shadow-sm">
          <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex flex-col gap-2.5 p-4 font-mono text-sm">
            {SNIPPET.map((line) => (
              <div key={line.cmd} className="flex gap-2">
                <span className="select-none text-muted-foreground">$</span>
                <span>{line.cmd}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full rounded-xl border bg-card p-6 text-left">
          <h2 className="text-sm font-medium">Or build it here</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your project&apos;s details, add the components you need, and download the
            result. Nothing is read from or written to your machine until you hit download.
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
            <FieldGroup>
              <FormField
                label="Project name"
                registration={form.register("name")}
                error={form.formState.errors.name}
                placeholder="my-app"
                autoFocus
              />
              <FormField
                label="Default namespace"
                registration={form.register("namespace")}
                error={form.formState.errors.namespace}
              />
              <FormField
                label="Output directory"
                registration={form.register("dir")}
                error={form.formState.errors.dir}
              />
            </FieldGroup>
            <Button type="submit" size="lg" className="mt-6 h-11 w-full">
              <Sparkles className="size-4" />
              Start building
            </Button>
          </form>
        </div>

        <Link
          href="/flow"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Waypoints className="size-4" />
          See how data flows through kikx
        </Link>
      </div>
    </main>
  );
}
