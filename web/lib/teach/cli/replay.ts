export const REPLAY_PARAM = "replay";
export const REPLAY_LIMIT = 50;
const COMMAND_LIMIT = 500;

export const sessionScript = (commands: string[]): string => commands.filter((command) => command.trim()).join("\n");

export function replayUrl(base: string, commands: string[]): string {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set(REPLAY_PARAM, sessionScript(commands.slice(-REPLAY_LIMIT)));
  return url.toString();
}

export function readReplay(search: string): string[] {
  const value = new URLSearchParams(search).get(REPLAY_PARAM);
  if (!value) return [];
  return value
    .split("\n")
    .map((command) => command.trim().slice(0, COMMAND_LIMIT))
    .filter(Boolean)
    .slice(0, REPLAY_LIMIT);
}

export function withoutReplay(href: string): string {
  const url = new URL(href);
  url.searchParams.delete(REPLAY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}
