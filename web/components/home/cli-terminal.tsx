"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/common/copy-button";

const COMMANDS = [
  "curl -fsSL https://raw.githubusercontent.com/yokwejuste/kikx/main/install.sh | bash",
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
    <div className="terminal w-full overflow-hidden rounded-xl border text-left shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-(--terminal-paper)/10 py-1.5 pr-1.5 pl-4">
        <span className="size-2.5 rounded-full bg-(--terminal-paper)/20" />
        <span className="size-2.5 rounded-full bg-(--terminal-paper)/20" />
        <span className="size-2.5 rounded-full bg-volt" />
        <CopyButton
          text={COMMANDS.join("\n")}
          size="icon"
          aria-label={t("copyCommands")}
          title={t("copyCommands")}
          className="ml-auto size-7 text-(--terminal-paper)/60 hover:bg-(--terminal-paper)/10 hover:text-(--terminal-paper) dark:hover:bg-(--terminal-paper)/10"
        >
          <Copy className="size-3.5" />
        </CopyButton>
      </div>
      <div className="flex flex-col gap-2.5 p-4 font-mono text-sm">
        {COMMANDS.map((command) => (
          <div key={command} className="flex gap-2">
            <span aria-hidden className="terminal-prompt select-none">
              $
            </span>
            <span className="min-w-0 flex-1 break-words">{command}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
