"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { Disclosure } from "@/components/common/disclosure";
import { RowActions } from "@/components/builder/fields/row-actions";
import { RowInput } from "@/components/builder/fields/row-input";
import { TagInputField } from "@/components/builder/fields/tag-input-field";
import { YamlField } from "@/components/builder/fields/format/yaml-field";
import type { RowErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import type { PlayValues } from "@/lib/forms/schemas";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/common/hint";
import { codeTag } from "@/components/common/rich-tags";

function Captioned({
  caption,
  as: Element = "label",
  className,
  children,
}: {
  caption: React.ReactNode;
  as?: "label" | "div";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Element className={cn("flex flex-col gap-1 text-xs text-muted-foreground", className)}>
      {caption}
      {children}
    </Element>
  );
}

function countConditions(play: PlayValues | undefined): number {
  if (!play) return 0;
  return play.roles.filter((role) => play.conditions?.[role]?.trim()).length;
}

function RoleConditions({ form, index, play }: { form: UseFormReturn<FormValues>; index: number; play: PlayValues | undefined }) {
  const t = useTranslations("plays.conditions");
  return (
    <Disclosure
      variant="dashed"
      title={t.rich("title", { code: codeTag })}
      hint={t("hint", { set: countConditions(play), total: play?.roles?.length ?? 0 })}
    >
      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        {!play?.roles?.length ? (
          <Hint>{t("empty")}</Hint>
        ) : (
          <Controller
            control={form.control}
            name={`plays.${index}.conditions` as never}
            render={({ field }) => {
              const conditions = (field.value as Record<string, string> | undefined) ?? {};
              return (
                <>
                  {play.roles.map((role) => (
                    <label key={role} className="grid items-center gap-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr]">
                      <span className="truncate font-mono text-foreground">{role}</span>
                      <Input
                        value={conditions[role] ?? ""}
                        placeholder={t("placeholder")}
                        className="font-mono text-xs"
                        onChange={(e) => field.onChange({ ...conditions, [role]: e.target.value })}
                      />
                    </label>
                  ))}
                </>
              );
            }}
          />
        )}
      </div>
    </Disclosure>
  );
}

function PrePostTasks({ form, index, play }: { form: UseFormReturn<FormValues>; index: number; play: PlayValues | undefined }) {
  const t = useTranslations("plays.tasks");
  const summary = [play?.preTasks?.trim() && t("pre"), play?.postTasks?.trim() && t("post")].filter(Boolean).join(" + ");
  return (
    <Disclosure variant="dashed" title={t("title")} hint={summary || t("none")}>
      <div className="grid gap-2 px-2.5 pb-2.5 sm:grid-cols-2">
        {(["preTasks", "postTasks"] as const).map((key) => (
          <Captioned as="div" key={key} caption={key === "preTasks" ? t("before") : t("after")}>
            <YamlField
              form={form}
              name={`plays.${index}.${key}`}
              label={key === "preTasks" ? t("before") : t("after")}
              placeholder={"- name: …\n  ansible.builtin.debug:\n    msg: …"}
              className="min-h-24 text-foreground"
            />
          </Captioned>
        ))}
        <Hint className="sm:col-span-2">
          {t.rich("help", { code: codeTag })}
        </Hint>
      </div>
    </Disclosure>
  );
}

export function PlayCard({
  form,
  index,
  count,
  play,
  errors,
  playbookName,
  hostsListId,
  defaultHosts,
  roleSuggestions,
  onMove,
  onRemove,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
  count: number;
  play: PlayValues | undefined;
  errors: RowErrors<PlayValues> | undefined;
  playbookName: string;
  hostsListId: string;
  defaultHosts: string;
  roleSuggestions: string[];
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("plays");
  const register = (field: keyof PlayValues) => form.register(`plays.${index}.${field}` as never);

  return (
    <li data-teach="play-card" className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <Hint as="span" className="font-medium">
          {play?.hosts ? t("headingOn", { number: index + 1, hosts: play.hosts }) : t("heading", { number: index + 1 })}
        </Hint>
        <RowActions
          index={index}
          count={count}
          labels={{ up: t("moveUp"), down: t("moveDown"), remove: t("remove") }}
          canRemove={count > 1}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Captioned caption={t("name")}>
          <RowInput
            placeholder={playbookName ? t("namePlaceholder", { name: playbookName }) : t("nameFallback")}
            invalid={!!errors?.name}
            className="text-foreground"
            registration={register("name")}
          />
        </Captioned>
        <Captioned caption={t("hosts")}>
          <RowInput
            data-teach="play-hosts"
            list={hostsListId}
            placeholder={defaultHosts}
            invalid={!!errors?.hosts}
            mono
            className="text-foreground"
            registration={register("hosts")}
          />
        </Captioned>
      </div>

      <Captioned as="div" caption={t("roles")}>
        <TagInputField
          form={form}
          name={`plays.${index}.roles`}
          aria-label={t("rolesLabel")}
          ordered
          suggestions={roleSuggestions}
          placeholder={t("rolesPlaceholder")}
          invalid={!!errors?.roles}
        />
      </Captioned>

      <RoleConditions form={form} index={index} play={play} />
      <PrePostTasks form={form} index={index} play={play} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <Captioned as="div" caption={t("tags")}>
          <TagInputField form={form} name={`plays.${index}.tags`} aria-label={t("tagsLabel")} placeholder={t("tagsPlaceholder")} />
        </Captioned>
        <label className="flex h-8 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 rounded border-input accent-primary" {...register("become")} />
          {t("become")}
        </label>
      </div>

      <FieldError className="text-xs" errors={[errors?.name, errors?.hosts, errors?.roles]} />
    </li>
  );
}
