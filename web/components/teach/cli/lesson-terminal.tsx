"use client";

import { useEffect, useRef } from "react";
import { Eraser, Link, Play, RotateCcw, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";
import { PromptLine, TerminalButton, TerminalCopyButton, TerminalFrame } from "@/components/common/terminal";
import { TerminalEntry } from "@/components/teach/cli/terminal-output";
import { useShellInput } from "@/components/teach/cli/use-shell-input";
import { useTeach } from "@/components/teach/teach-provider";
import { cwdOf } from "@/lib/teach/cli/engine";
import { readReplay, replayUrl, sessionScript, withoutReplay } from "@/lib/teach/cli/replay";
import { cliSession, useCliSession } from "@/lib/teach/cli/session";
import { projectDefaults } from "@/lib/registry/store";

function useReplayLink(active: boolean) {
  useEffect(() => {
    if (active) return;
    const commands = readReplay(window.location.search);
    if (commands.length === 0) return;
    window.history.replaceState(window.history.state, "", withoutReplay(window.location.href));
    void cliSession.replay(commands);
  }, [active]);
}

export function LessonTerminal() {
  const t = useTranslations("learnCli");
  const { active } = useTeach();
  const { entries, busy, ran } = useCliSession();
  const scroller = useRef<HTMLDivElement>(null);
  const { input, onKeyDown, submit } = useShellInput(busy);
  const earlier = entries.slice(0, -1);
  const latest = entries.at(-1);
  const script = sessionScript(ran);

  useReplayLink(active);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [entries]);

  const focusInput = () => {
    if (window.getSelection()?.isCollapsed ?? true) input.current?.focus();
  };

  return (
    <TerminalFrame
      data-teach="cli-terminal"
      title={cwdOf(projectDefaults().defaultProjectName)}
      className="flex min-h-pane flex-col"
      actions={
        !active && (
          <>
            <TerminalButton
              icon={Play}
              label={t("run")}
              disabled={busy}
              onClick={() => {
                submit();
                input.current?.focus();
              }}
            />
            <TerminalButton icon={Eraser} label={t("clear")} onClick={cliSession.clearScreen} />
            <TerminalCopyButton icon={ScrollText} text={script} label={t("copySession")} disabled={!script} />
            <TerminalCopyButton
              icon={Link}
              text={() => replayUrl(window.location.href, ran)}
              label={t("share")}
              disabled={!script}
            />
            <TerminalButton icon={RotateCcw} label={t("reset")} onClick={cliSession.reset} />
          </>
        )
      }
    >
      <div
        ref={scroller}
        onClick={focusInput}
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
            aria-keyshortcuts="Tab ArrowUp ArrowDown Control+C Control+L"
            placeholder={entries.length === 0 ? t("placeholder") : undefined}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-terminal-muted"
            onKeyDown={onKeyDown}
          />
        </PromptLine>
      </div>
    </TerminalFrame>
  );
}
