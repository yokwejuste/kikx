"use client";

import { useTranslations } from "next-intl";
import { PromptLine, TerminalCopyButton, TerminalFrame } from "@/components/common/terminal";
import { INSTALL_COMMAND } from "@/lib/cli/repository";

const COMMANDS = [
  INSTALL_COMMAND,
  "kikx init --name <project>",
  "kikx presets",
  "kikx setup <template>",
  "kikx list",
  "kikx add <category>/<component> --name <name> --set key=value",
  "kikx apply ./<project>.kikx-preset.json",
];

export function CliTerminal() {
  const t = useTranslations("home");
  return (
    <TerminalFrame actions={<TerminalCopyButton text={COMMANDS.join("\n")} label={t("copyCommands")} />}>
      <div className="flex flex-col gap-2.5 p-4 font-mono text-sm">
        {COMMANDS.map((command) => (
          <PromptLine key={command}>
            <span className="min-w-0 flex-1 break-words">{command}</span>
          </PromptLine>
        ))}
      </div>
    </TerminalFrame>
  );
}
