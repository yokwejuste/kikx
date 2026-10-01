import { REPOSITORY } from "@/lib/cli/repository";

export interface RepositoryStats {
  stars: number;
  forks: number;
}

export const STATS_URL = `https://api.github.com/repos/${REPOSITORY}`;
export const STATS_HEADERS = { Accept: "application/vnd.github+json" };

export function parseStats(data: { stargazers_count?: number; forks_count?: number }): RepositoryStats {
  return { stars: data.stargazers_count ?? 0, forks: data.forks_count ?? 0 };
}
