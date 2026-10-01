"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { SectionLabel } from "@/components/common/section-label";
import { FileContent } from "@/components/builder/preview/file-content";
import { cliSession, useCliSession } from "@/lib/teach/cli/session";
import type { CliMachine } from "@/lib/teach/cli/engine";
import { fileTree, type TreeNode } from "@/lib/teach/cli/tree";
import { cn } from "@/lib/utils";

const INDENT_REM = 1;

function NodeLabel({ node }: { node: TreeNode }) {
  return (
    <>
      <span aria-hidden className="truncate">
        {node.name}
      </span>
      <span className="sr-only">{node.path}</span>
    </>
  );
}

function useCollapsed(machine: CliMachine) {
  const [collapsed, setCollapsed] = useState<{ machine: CliMachine; paths: Set<string> }>({ machine, paths: new Set() });
  const paths = collapsed.machine === machine ? collapsed.paths : new Set<string>();
  const toggle = (path: string) => {
    const next = new Set(paths);
    if (!next.delete(path)) next.add(path);
    setCollapsed({ machine, paths: next });
  };
  return { paths, toggle };
}

export function ProjectFiles() {
  const t = useTranslations("learnCli");
  const { machine, selected } = useCliSession();
  const { paths: collapsed, toggle } = useCollapsed(machine);
  const hidden = (node: TreeNode) => [...collapsed].some((folder) => node.path.startsWith(`${folder}/`));
  const nodes = fileTree(machine).filter((node) => !hidden(node));
  const content = selected ? machine.files[selected] : undefined;

  return (
    <div className="flex min-h-pane flex-col gap-3">
      <section data-teach="cli-files" className="flex min-h-0 flex-1 flex-col gap-2 rounded-xl border bg-card p-3">
        <SectionLabel as="h2">{t("files")}</SectionLabel>
        {nodes.length === 0 ? (
          <EmptyState className="p-6">{t("noFiles")}</EmptyState>
        ) : (
          <ul className="min-h-0 overflow-y-auto">
            {nodes.map((node) => {
              const open = !collapsed.has(node.path);
              const current = node.path === selected;
              const Chevron = open ? ChevronDown : ChevronRight;
              return (
                <li key={node.path} style={{ paddingLeft: `${node.depth * INDENT_REM}rem` }}>
                  {node.folder ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      data-teach="cli-file"
                      aria-expanded={open}
                      onClick={() => toggle(node.path)}
                      className="w-full cursor-pointer justify-start font-mono text-xs font-normal text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground hover:aria-expanded:bg-muted"
                    >
                      <Chevron aria-hidden />
                      <Folder aria-hidden />
                      <NodeLabel node={node} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      data-teach="cli-file"
                      aria-current={current ? "true" : undefined}
                      onClick={() => cliSession.select(node.path)}
                      className={cn(
                        "w-full cursor-pointer justify-start pl-7 font-mono text-xs font-normal",
                        current && "bg-muted font-medium",
                      )}
                    >
                      <FileText aria-hidden className="text-muted-foreground" />
                      <NodeLabel node={node} />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <div data-teach="cli-viewer" className="flex min-h-0 flex-viewer flex-col">
        {selected && content !== undefined ? (
          <FileContent file={{ path: selected, content }} />
        ) : (
          <EmptyState className="flex-1 p-6">{t("pickFile")}</EmptyState>
        )}
      </div>
    </div>
  );
}
