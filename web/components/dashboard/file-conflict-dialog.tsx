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

export function FileConflictDialog({
  conflicts,
  onCancel,
  onConfirm,
}: {
  conflicts: string[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!conflicts?.length} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File{conflicts && conflicts.length > 1 ? "s" : ""} already added</DialogTitle>
          <DialogDescription>
            <span className="flex flex-col gap-1">
              {conflicts?.map((path) => (
                <code key={path} className="font-mono text-xs">
                  {path}
                </code>
              ))}
            </span>
            {conflicts && conflicts.length > 1 ? "are" : "is"} already in your project. Replace{" "}
            {conflicts && conflicts.length > 1 ? "them" : "it"}?
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
