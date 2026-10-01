import { GithubLinkView } from "@/components/layout/github-link-view";
import { parseStats, STATS_HEADERS, STATS_URL, type RepositoryStats } from "@/lib/github/stats";

const REFRESH_SECONDS = 600;

async function repositoryStats(): Promise<RepositoryStats | null> {
  try {
    const response = await fetch(STATS_URL, { headers: STATS_HEADERS, next: { revalidate: REFRESH_SECONDS } });
    return response.ok ? parseStats(await response.json()) : null;
  } catch {
    return null;
  }
}

export async function GithubLink() {
  return <GithubLinkView initial={await repositoryStats()} />;
}
