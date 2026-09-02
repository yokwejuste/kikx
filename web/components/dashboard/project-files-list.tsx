"use client";

import { useState } from "react";
import { Download, FileCode2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/panel";
import { SetupCommand } from "@/components/dashboard/setup-command";
import { downloadProjectZip } from "@/lib/download";
import { useProject } from "@/lib/project-context";

export function ProjectFilesList() {
  const { details, components, removeComponent } = useProject();
  const [downloading, setDownloading] = useState(false);

  return (
    <Panel
      title="Your project"
      description={`Nothing is written to disk until you download — files stay in this browser tab.`}
      contentClassName="p-3"
    >
      {components.length === 0 ? (
        <p className="px-2 py-4 text-sm text-muted-foreground">Nothing added yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {components.flatMap((component) =>
            component.files.map((file) => (
              <li
                key={file.fileName}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted/50"
              >
                <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-mono text-xs">{file.fileName}</span>
                <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                  {file.component}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeComponent(component.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            )),
          )}
        </ul>
      )}

      <Button
        type="button"
        className="mt-3 w-full"
        disabled={components.length === 0 || downloading || !details}
        onClick={async () => {
          if (!details) return;
          setDownloading(true);
          try {
            await downloadProjectZip(details, components);
          } finally {
            setDownloading(false);
          }
        }}
      >
        <Download className="size-4" />
        {downloading ? "Zipping…" : "Download .zip"}
      </Button>

      {components.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <SetupCommand />
        </div>
      )}
    </Panel>
  );
}
