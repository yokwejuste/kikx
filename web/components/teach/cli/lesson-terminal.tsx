"use client";

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/common/icon-button";
import { PromptLine, TerminalFrame, terminalButtonClass } from "@/components/common/terminal";
import { TerminalEntry } from "@/components/teach/cli/terminal-output";
import { useTeach } from "@/components/teach/teach-provider";
import { cwdOf } from "@/lib/teach/cli/engine";
import { cliSession, useCliSession } from "@/lib/teach/cli/session";
import { projectDefaults } from "@/lib/registry/store";

export function LessonTerminal() {
  const t = useTranslations("learnCli");
  const { active } = useTeach();
  const { entries, busy } = useCliSession();
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const earlier = entries.slice(0, -1);
  const latest = entries.at(-1);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [entries]);

  return (
    <TerminalFrame
      data-teach="cli-terminal"
      title={cwdOf(projectDefaults().defaultProjectName)}
      className="flex min-h-[24rem] flex-col"
      actions={
        !active && (
          <IconButton icon={RotateCcw} label={t("reset")} size="sm" className={terminalButtonClass} onClick={cliSession.reset} />
        )
      }
    >
      <div
        ref={scroller}
        onClick={() => input.current?.focus()}
        className="flex min-h-0 flex-1 cursor-text flex-col gap-3 overflow-y-auto p-4 font-mono text-sm"
      >
        {earlier.map((entry) => (
          <TerminalEntry key={entry.id} entry={entry} />
        ))}
        {latest && (
          <div key={latest.id} data-teach="cli-last">
            <TerminalEntry entry={latest} />
          </div>
        )}
        <PromptLine className="items-center">
          <input
            ref={input}
            data-teach="cli-input"
            aria-label={t("prompt")}
            placeholder={entries.length === 0 ? t("placeholder") : undefined}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--terminal-paper)/40"
            onKeyDown={(event) => {
              if (event.key !== "Enter" || busy) return;
              event.preventDefault();
              const command = event.currentTarget.value;
              event.currentTarget.value = "";
              void cliSession.execute(command);
            }}
          />
        </PromptLine>
      </div>
    </TerminalFrame>
  );
}
