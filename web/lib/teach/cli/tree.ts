import { joinPath } from "./paths.ts";
import { isDirectory, listDirectory, type CliMachine } from "./engine.ts";

export interface TreeNode {
  name: string;
  path: string;
  depth: number;
  folder: boolean;
}

export function fileTree(machine: CliMachine, path = "", depth = 0): TreeNode[] {
  const entries = listDirectory(machine, path).map((entry) => {
    const name = entry.replace(/\/$/, "");
    const full = joinPath(path, name);
    return { name, path: full, depth, folder: entry.endsWith("/") || isDirectory(machine, full) };
  });
  const ordered = [...entries.filter((entry) => entry.folder), ...entries.filter((entry) => !entry.folder)];
  return ordered.flatMap((node) => [node, ...(node.folder ? fileTree(machine, node.path, depth + 1) : [])]);
}
