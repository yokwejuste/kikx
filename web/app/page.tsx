"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { projectDirSchema } from "@/lib/schemas";

export default function Home() {
  const router = useRouter();
  const [dir, setDir] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    const result = projectDirSchema.safeParse(dir);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid path");
      return;
    }
    setError(null);
    router.push(`/dashboard?dir=${encodeURIComponent(result.data)}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>kikx</CardTitle>
          <CardDescription>
            Vendor real, editable Kubernetes manifests into your project. Enter the absolute
            path of the project you want to set up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOpen} className="flex flex-col gap-4">
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="project-dir">Project directory</FieldLabel>
              <Input
                id="project-dir"
                placeholder="/Users/you/code/my-app"
                value={dir}
                onChange={(e) => setDir(e.target.value)}
                autoFocus
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Button type="submit">Open</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
