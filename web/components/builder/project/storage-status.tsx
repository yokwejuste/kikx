"use client";

import { useMemo } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type { AddedComponent, ProjectDetails } from "@/lib/project/context";
import { projectFingerprint, type DownloadRecord } from "@/lib/project/downloads";
import { Hint } from "@/components/common/hint";

export function StorageStatus({
  details,
  components,
  lastDownload,
}: {
  details: ProjectDetails;
  components: AddedComponent[];
  lastDownload: DownloadRecord | null;
}) {
  const t = useTranslations("builder.header.storage");
  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });
  const fingerprint = useMemo(() => projectFingerprint(details, components), [details, components]);

  const label = !lastDownload
    ? t("browser")
    : lastDownload.fingerprint === fingerprint
      ? t("downloaded", { time: format.relativeTime(lastDownload.at, now) })
      : t("changed");

  return (
    <Hint as="span" className="min-w-0 truncate" title={t("hint")}>
      {label}
    </Hint>
  );
}
