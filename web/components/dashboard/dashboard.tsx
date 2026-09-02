"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { InitProjectForm } from "@/components/dashboard/init-project-form";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { ComponentTabs } from "@/components/dashboard/component-tabs";
import { VendoredFilesList } from "@/components/dashboard/vendored-files-list";

export function Dashboard({ dir }: { dir: string }) {
  const projectQuery = useQuery({
    queryKey: queryKeys.project(dir),
    queryFn: () => api.getProject(dir),
  });

  if (projectQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (projectQuery.isError) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-medium">Could not reach the kikx backend</p>
        <p className="text-sm text-muted-foreground">
          {(projectQuery.error as Error).message} — is <code>kikx-backend</code> running?
        </p>
      </main>
    );
  }

  const state = projectQuery.data!;

  if (!state.exists) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
        <InitProjectForm dir={dir} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <ProjectHeader project={state.project!} />
      <ComponentTabs dir={dir} />
      <VendoredFilesList dir={dir} files={state.vendoredFiles} />
    </main>
  );
}
