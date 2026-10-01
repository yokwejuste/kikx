"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/builder/fields/form-field";
import { projectSettingsSchema, type ProjectSettingsValues } from "@/lib/forms/schemas";
import { useProject, type ProjectDetails } from "@/lib/project/context";

export type ProjectSetting = keyof ProjectSettingsValues;

function ProjectSettingsForm({
  details,
  focus,
  onDone,
}: {
  details: ProjectDetails;
  focus: ProjectSetting;
  onDone: () => void;
}) {
  const t = useTranslations("builder.settings");
  const { components, setDetails } = useProject();
  const form = useForm<ProjectSettingsValues>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: { namespace: details.namespace, dir: details.outputDir },
  });
  const namespace = useWatch({ control: form.control, name: "namespace" });
  const namespaceChanged = components.length > 0 && namespace.trim() !== "" && namespace !== details.namespace;

  function onSubmit(values: ProjectSettingsValues) {
    setDetails({ ...details, namespace: values.namespace, outputDir: values.dir });
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <FieldGroup>
        <FormField
          label={t("namespace")}
          help="namespace"
          registration={form.register("namespace")}
          error={form.formState.errors.namespace}
          description={namespaceChanged ? t("namespaceHint", { previous: details.namespace }) : undefined}
          autoFocus={focus === "namespace"}
        />
        <FormField
          label={t("outputDir")}
          help="outputDir"
          registration={form.register("dir")}
          error={form.formState.errors.dir}
          description={t("outputDirHint")}
          autoFocus={focus === "dir"}
        />
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit">{t("save")}</Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectSettingsDialog({
  details,
  focus,
  onClose,
}: {
  details: ProjectDetails;
  focus: ProjectSetting | null;
  onClose: () => void;
}) {
  const t = useTranslations("builder.settings");

  return (
    <Dialog open={focus !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        {focus && <ProjectSettingsForm details={details} focus={focus} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
