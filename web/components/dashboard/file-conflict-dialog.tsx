"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PendingFile {
  fileName: string;
  component: string;
  content: string;
}

export function FileConflictDialog({
  pendingFile,
  onCancel,
  onConfirm,
}: {
  pendingFile: PendingFile | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!pendingFile} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File already added</DialogTitle>
          <DialogDescription>
            <code className="font-mono text-xs">{pendingFile?.fileName}</code> is already in your
            project. Replace it?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
