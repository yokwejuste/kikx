"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { Disclosure } from "@/components/common/disclosure";
import { RowActions } from "@/components/builder/fields/row-actions";
import { TagInputField } from "@/components/builder/fields/tag-input-field";
import type { RowErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import type { PlayValues } from "@/lib/forms/schemas";
import { cn } from "@/lib/utils";

/**
 * A caption above a control. Use `as="div"` around a TagInput: a <label> would forward clicks on its chips'
 * remove buttons.
 */
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
  return (
    <Disclosure
      variant="dashed"
      title={
        <>
          Role conditions (<code className="font-mono">when:</code>)
        </>
      }
      hint={`${countConditions(play)} of ${play?.roles?.length ?? 0} set`}
    >
      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        {!play?.roles?.length ? (
          <p className="text-xs text-muted-foreground">Add roles above first.</p>
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
                        placeholder="always runs — or a Jinja condition"
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
  const summary = [play?.preTasks?.trim() && "pre", play?.postTasks?.trim() && "post"].filter(Boolean).join(" + ");
  return (
    <Disclosure variant="dashed" title={<>Pre-tasks &amp; post-tasks</>} hint={summary || "none"}>
      <div className="grid gap-2 px-2.5 pb-2.5 sm:grid-cols-2">
        {(["preTasks", "postTasks"] as const).map((key) => (
          <Captioned key={key} caption={key === "preTasks" ? "Before the roles" : "After the roles"}>
            <Textarea
              spellCheck={false}
              placeholder={"- name: …\n  ansible.builtin.debug:\n    msg: …"}
              className="min-h-24 font-mono text-xs text-foreground"
              {...form.register(`plays.${index}.${key}` as never)}
            />
          </Captioned>
        ))}
        <p className="text-xs text-muted-foreground sm:col-span-2">
          A YAML list of tasks, written as-is under <code className="font-mono">pre_tasks:</code> /{" "}
          <code className="font-mono">post_tasks:</code>.
        </p>
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
  const register = (field: keyof PlayValues) => form.register(`plays.${index}.${field}` as never);

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Play {index + 1}
          {play?.hosts ? ` · runs on ${play.hosts}` : ""}
        </span>
        <RowActions
          index={index}
          count={count}
          labels={{ up: "Move play up", down: "Move play down", remove: "Remove play" }}
          canRemove={count > 1}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Captioned caption="Name">
          <Input
            placeholder={playbookName ? `e.g. ${playbookName}` : "What this play does"}
            aria-invalid={!!errors?.name}
            className="text-foreground"
            {...register("name")}
          />
        </Captioned>
        <Captioned caption="Runs on (hosts)">
          <Input
            list={hostsListId}
            placeholder={defaultHosts}
            aria-invalid={!!errors?.hosts}
            className="font-mono text-foreground"
            {...register("hosts")}
          />
        </Captioned>
      </div>

      <Captioned as="div" caption="Roles, in the order they run">
        <TagInputField
          form={form}
          name={`plays.${index}.roles`}
          aria-label="Roles"
          ordered
          suggestions={roleSuggestions}
          placeholder="role names, in run order"
          invalid={!!errors?.roles}
        />
      </Captioned>

      <RoleConditions form={form} index={index} play={play} />
      <PrePostTasks form={form} index={index} play={play} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <Captioned as="div" caption="Tags (optional)">
          <TagInputField form={form} name={`plays.${index}.tags`} aria-label="Tags" placeholder="tag names" />
        </Captioned>
        <label className="flex h-8 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 rounded border-input accent-primary" {...register("become")} />
          Run as root (become)
        </label>
      </div>

      <FieldError className="text-xs" errors={[errors?.name, errors?.hosts, errors?.roles]} />
    </li>
  );
}
