import { REPOSITORY } from "@/lib/cli/repository";
import { compareVersions } from "@/lib/teach/cli/engine";

interface Release {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
}

let releases: Promise<string[]> | null = null;

async function fetchReleases(): Promise<string[]> {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/releases`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const body = (await response.json()) as Release[];
  return body
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => release.tag_name.replace(/^v/, ""))
    .sort((left, right) => compareVersions(right, left));
}

export function kikxReleases(): Promise<string[]> {
  releases ??= fetchReleases().catch((error) => {
    releases = null;
    throw error;
  });
  return releases;
}
