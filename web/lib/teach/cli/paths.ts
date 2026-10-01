export function normalizePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === ".." && parts.length > 0 && parts[parts.length - 1] !== "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

export const joinPath = (...parts: string[]): string => normalizePath(parts.filter(Boolean).join("/"));

export function ancestors(path: string): string[] {
  const parts = normalizePath(path).split("/");
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/"));
}

export const escapes = (path: string): boolean => path.startsWith("/") || normalizePath(path).split("/")[0] === "..";

export const baseName = (path: string): string => path.slice(path.lastIndexOf("/") + 1);
