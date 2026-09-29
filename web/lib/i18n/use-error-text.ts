"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { ApiClientError } from "@/lib/api/client";
import { LocalizedError, parseValidationMessage } from "@/lib/i18n/localized-error";

export function useErrorText() {
  const t = useTranslations();
  return useCallback(
    (error: unknown, fallbackKey: string) => {
      if (error instanceof LocalizedError) return t(error.key, error.values);
      if (error instanceof ApiClientError) return error.message;
      if (error instanceof TypeError) return t("errors.network");
      return t(fallbackKey);
    },
    [t],
  );
}

export function useValidationText() {
  const t = useTranslations();
  return useCallback(
    (message: string | undefined) => {
      if (!message) return message;
      const parsed = parseValidationMessage(message);
      return parsed ? t(parsed.key, parsed.values) : message;
    },
    [t],
  );
}
