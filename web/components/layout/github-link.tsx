import { GitFork, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import packageJson from "@/package.json";

const REPOSITORY_URL = packageJson.repository.url;
const REPOSITORY = new URL(REPOSITORY_URL).pathname.replace(/^\/|\.git$/g, "");
const REFRESH_SECONDS = 3600;

interface RepositoryStats {
  stars: number;
  forks: number;
}

async function repositoryStats(): Promise<RepositoryStats | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: REFRESH_SECONDS },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return { stars: data.stargazers_count ?? 0, forks: data.forks_count ?? 0 };
  } catch {
    return null;
  }
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export async function GithubLink() {
  const t = await getTranslations("header");
  const stats = await repositoryStats();
  const format = new Intl.NumberFormat(undefined, { notation: "compact" });
  return (
    <a
      href={REPOSITORY_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={stats ? t("github", { repository: REPOSITORY, stars: stats.stars, forks: stats.forks }) : REPOSITORY}
      title={REPOSITORY}
      className="flex items-center gap-2 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:min-h-10"
    >
      <GithubMark className="size-4 shrink-0" />
      <span className="hidden flex-col leading-tight lg:flex">
        <span className="text-xs text-foreground">{REPOSITORY}</span>
        {stats && (
          <span className="flex items-center gap-2 text-[11px] tabular-nums">
            <span className="flex items-center gap-0.5">
              <Star className="size-3" />
              {format.format(stats.stars)}
            </span>
            <span className="flex items-center gap-0.5">
              <GitFork className="size-3" />
              {format.format(stats.forks)}
            </span>
          </span>
        )}
      </span>
      {stats && (
        <span className="hidden items-center gap-0.5 text-xs tabular-nums sm:flex lg:hidden">
          <Star className="size-3" />
          {format.format(stats.stars)}
        </span>
      )}
    </a>
  );
}
