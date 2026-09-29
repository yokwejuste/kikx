"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, TriangleAlert, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseInventoryIni, type ParsedInventory } from "@/lib/ansible/inventory";

const FORMAT_HINT = `[<group>]
<host> ansible_host=<address> <key>=<value>

[<parent-group>:children]
<group>

[<parent-group>:vars]
<key>=<value>`;

export function InventoryImportDialog({ onImport }: { onImport: (parsed: ParsedInventory) => void }) {
  const t = useTranslations("inventory.import");
  const root = useTranslations();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseInventoryIni(text) : null), [text]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setText("");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ClipboardPaste />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t.rich("body", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={FORMAT_HINT}
          spellCheck={false}
          className="max-h-80 min-h-48 font-mono text-xs"
        />

        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Upload className="size-4" />
            {t("chooseFile")}
            <input
              type="file"
              accept=".ini,.cfg,.txt,text/plain"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setText(await file.text());
                e.target.value = "";
              }}
            />
          </label>
          {parsed && (
            <p className="text-sm text-muted-foreground">
              {t("counts", { hosts: parsed.hosts.length, groups: parsed.groups.length })}
            </p>
          )}
        </div>

        {parsed && parsed.warnings.length > 0 && (
          <ul className="flex max-h-32 flex-col gap-1 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
            {parsed.warnings.map((warning, index) => (
              <li key={index} className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {root(warning.key, warning.values)}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!parsed || parsed.hosts.length === 0}
            onClick={() => {
              if (!parsed) return;
              onImport(parsed);
              setOpen(false);
              setText("");
            }}
          >
            {t("replace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
