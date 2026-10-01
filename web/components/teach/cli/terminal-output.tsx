"use client";

import { useTranslations } from "next-intl";
import { PromptLine, TerminalCopyButton } from "@/components/common/terminal";
import { Spinner } from "@/components/common/spinner";
import type { OutputLine, Tone } from "@/lib/teach/cli/format";
import type { CliEntry } from "@/lib/teach/cli/session";

const TONES: Record<Tone, string> = {
  success: "font-semibold text-terminal-prompt",
  heading: "font-semibold",
  hint: "text-terminal-muted",
  volt: "text-terminal-prompt",
  error: "font-semibold text-terminal-error",
};

function TerminalLine({ line }: { line: OutputLine }) {
  const t = useTranslations("learnCli");
  if ("tip" in line) {
    return (
      <p data-teach="cli-line" className="font-sans text-xs text-terminal-muted">
        {t("tip", { name: line.tip })}
      </p>
    );
  }
  if ("notice" in line) {
    return (
      <p data-teach="cli-line" className="font-sans text-terminal-foreground/70 italic">
        {t(`notices.${line.notice}`)}
      </p>
    );
  }
  return (
    <div data-teach="cli-line" className="min-h-lh break-words whitespace-pre-wrap">
      {line.map((segment, index) => (
        <span key={index} className={segment.tone && TONES[segment.tone]}>
          {segment.text}
        </span>
      ))}
    </div>
  );
}

export function TerminalEntry({ entry }: { entry: CliEntry }) {
  const t = useTranslations("learnCli");
  return (
    <div className="group flex flex-col gap-1">
      <PromptLine className="items-start">
        <span className="min-w-0 flex-1 break-words">
          {entry.command}
          {entry.interrupted && <span className="text-terminal-muted">^C</span>}
        </span>
        {entry.command.trim() && !entry.interrupted && (
          <TerminalCopyButton
            data-teach="cli-copy"
            text={entry.command}
            label={t("copy")}
            className="-my-1 size-6 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
          />
        )}
      </PromptLine>
      {entry.running ? (
        <Spinner className="text-terminal-muted motion-reduce:animate-none" />
      ) : (
        entry.lines.map((line, index) => <TerminalLine key={index} line={line} />)
      )}
    </div>
  );
}
