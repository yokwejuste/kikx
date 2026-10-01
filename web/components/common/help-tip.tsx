"use client";

import { CircleHelp, ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { glossaryDocsHref, type GlossaryTerm } from "@/lib/glossary/terms";
import { cn } from "@/lib/utils";

export function HelpTip({ term, className }: { term: GlossaryTerm | undefined; className?: string }) {
  const t = useTranslations("glossary");
  const locale = useLocale();
  if (!term) return null;
  const name = t(`terms.${term}.term`);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("ask", { term: name })}
          title={t("ask", { term: name })}
          className={cn("align-middle text-muted-foreground hover:text-foreground pointer-coarse:size-9", className)}
        >
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={name} className="flex flex-col gap-1.5 text-left">
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground">{t(`terms.${term}.definition`)}</p>
        <a
          href={glossaryDocsHref(term, locale)}
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-1 text-brand underline-offset-4 hover:underline pointer-coarse:min-h-10"
        >
          {t("learnMore")}
          <ExternalLink className="size-3.5" />
        </a>
      </PopoverContent>
    </Popover>
  );
}
