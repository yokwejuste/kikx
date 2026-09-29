"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, TriangleAlert, Upload } from "lucide-react";
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
          Import inventory.ini
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import an existing inventory</DialogTitle>
          <DialogDescription>
            Paste an INI inventory (or pick the file). Hosts listed in several groups are merged into one host with
            several groups; group <code className="font-mono">:children</code> and <code className="font-mono">:vars</code>{" "}
            come along too.
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
            Choose a file…
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
              {parsed.hosts.length} host{parsed.hosts.length === 1 ? "" : "s"} · {parsed.groups.length} group
              {parsed.groups.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {parsed && parsed.warnings.length > 0 && (
          <ul className="flex max-h-32 flex-col gap-1 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
            {parsed.warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
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
            Replace hosts &amp; groups
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
