"use client";

import { useEffect, useMemo, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toProjectFiles } from "@/components/builder/editor/project-files";
import type { PreviewStatus } from "@/components/builder/preview/yaml-preview";
import { api, ApiClientError } from "@/lib/api/client";
import { schemas, toRenderRequest, type FormValues } from "@/lib/forms/component-forms";
import type { ComponentKind } from "@/lib/registry/references";

const PREVIEW_DEBOUNCE_MS = 350;

export function useRenderPreview({
  form,
  kind,
  namespace,
  initial,
}: {
  form: UseFormReturn<FormValues>;
  kind: ComponentKind;
  namespace: string;
  initial: FormValues;
}) {
  const serialized = JSON.stringify(useWatch({ control: form.control }) ?? null);
  const [draft, setDraft] = useState<FormValues>(initial);
  useEffect(() => {
    const timer = setTimeout(() => setDraft(JSON.parse(serialized) as FormValues), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [serialized]);

  const request = useMemo(() => {
    const parsed = schemas[kind].safeParse(draft);
    return parsed.success ? toRenderRequest(namespace, parsed.data as FormValues) : null;
  }, [draft, kind, namespace]);

  const preview = useQuery({
    queryKey: ["render", request],
    queryFn: () => api.render(request!),
    enabled: !!request,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });

  const status: PreviewStatus = !request
    ? "invalid"
    : preview.isFetching
      ? "loading"
      : preview.isError
        ? "error"
        : "ready";
  const error =
    preview.error instanceof ApiClientError ? preview.error.message : preview.error ? "Render failed" : undefined;

  return {
    rendered: preview.data?.files ?? null,
    files: preview.data ? toProjectFiles(preview.data) : null,
    status,
    error,
  };
}
