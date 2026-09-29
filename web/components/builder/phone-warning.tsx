"use client";

import { useSyncExternalStore } from "react";
import { Link2, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KikxMark } from "@/components/common/kikx-mark";

const PHONE_QUERY = "(max-width: 639px)";
const DISMISSED_KEY = "kikx.phoneWarning.dismissed";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

const dismissalListeners = new Set<() => void>();
let dismissedThisPage = false;

function subscribeDismissal(onChange: () => void) {
  dismissalListeners.add(onChange);
  return () => {
    dismissalListeners.delete(onChange);
  };
}

function isDismissed() {
  return dismissedThisPage || wasDismissed();
}

function dismiss() {
  dismissedThisPage = true;
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {}
  dismissalListeners.forEach((listener) => listener());
}

export function usePhoneWarningOpen() {
  const isPhone = useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches, () => false);
  const dismissed = useSyncExternalStore(subscribeDismissal, isDismissed, () => true);
  return isPhone && !dismissed;
}

export function PhoneWarning() {
  const t = useTranslations("phone");
  const open = usePhoneWarningOpen();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="mb-2 flex items-center gap-3 text-foreground" aria-hidden="true">
            <Smartphone className="size-8" />
            <KikxMark className="size-8" />
          </span>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" onClick={dismiss} className="w-full">
            {t("continue")}
          </Button>
          <Button type="button" variant="outline" onClick={copyLink} className="w-full">
            <Link2 />
            {t("copyLink")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
