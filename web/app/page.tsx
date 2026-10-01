"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useErrorText } from "@/lib/i18n/use-error-text";
import { PronounceButton } from "@/components/common/pronounce-button";
import { ArrowRight, Download, FolderOpen, History, Sparkles, Waypoints, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/builder/fields/form-field";
import { useProject } from "@/lib/project/context";
import { projectNameSchema, type ProjectNameValues } from "@/lib/forms/schemas";
import { api } from "@/lib/api/client";
import {
  downloadPreset,
  loadPresetManifest,
  parsePresetManifest,
  toPresetManifest,
  type PresetManifest,
} from "@/lib/project/preset";
import { loadStoredProject } from "@/lib/project/storage";
import { ConfirmPrompt } from "@/components/common/confirm-prompt";
import { projectDefaults } from "@/lib/registry/store";
import { RegistryGate } from "@/components/layout/registry-gate";
import { TabsContent } from "@/components/ui/tabs";
import { ModeTabs, ModeTabsList } from "@/components/teach/mode-tabs";
import { TemplateGallery } from "@/components/home/template-gallery";
import { CliTerminal } from "@/components/home/cli-terminal";
import { KikxMark } from "@/components/common/kikx-mark";
import { IconTile } from "@/components/common/icon-tile";
import { IconButton } from "@/components/common/icon-button";
import { HelpTip } from "@/components/common/help-tip";
import { useFirstVisitTour } from "@/lib/tour/use-tour";
import { codeTag } from "@/components/common/rich-tags";

type ReplaceAction = "blank" | "template" | "file";

type Pending =
  | { kind: "discard" }
  | { kind: "replace"; action: ReplaceAction; target: string; run: () => void };

export default function Home() {
  return (
    <RegistryGate>
      <HomeContent />
    </RegistryGate>
  );
}

function HomeContent() {
  const t = useTranslations("home");
  const errorText = useErrorText();
  const defaults = projectDefaults();
  const router = useRouter();
  const { details, components, setDetails, reset, loadProject } = useProject();
  const [opening, setOpening] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  useFirstVisitTour("home");

  function confirmReplace(action: ReplaceAction, target: string, run: () => void) {
    if (loadStoredProject()?.details) {
      setPending({ kind: "replace", action, target, run });
    } else {
      run();
    }
  }

  async function open(label: string, manifest: () => Promise<PresetManifest>, fallbackName: string) {
    setOpening(label);
    try {
      const { details, components } = await loadPresetManifest(await manifest(), fallbackName);
      loadProject(details, components);
      router.push("/build");
    } catch (error) {
      toast.error(errorText(error, "home.openFailed"));
    } finally {
      setOpening(null);
    }
  }

  const presetInputId = useId();
  const form = useForm<ProjectNameValues>({
    resolver: zodResolver(projectNameSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: ProjectNameValues) {
    confirmReplace("blank", values.name, () => {
      reset();
      setDetails({ name: values.name, namespace: defaults.defaultNamespace, outputDir: defaults.defaultOutputDir });
      router.push("/build");
    });
  }

  function renderPrompt(prompt: Pending) {
    const stored = loadStoredProject();
    const storedDetails = stored?.details ?? details;
    const storedComponents = stored?.components ?? components;
    const name = storedDetails?.name ?? "";
    const count = storedComponents.length;
    if (prompt.kind === "discard") {
      return (
        <ConfirmPrompt
          title={t("resume.confirmTitle", { name })}
          body={t("resume.confirmBody", { count })}
          cancelLabel={t("resume.keep")}
          confirmLabel={t("resume.discard")}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            reset();
            setPending(null);
            toast.success(t("resume.discarded", { name }));
          }}
        />
      );
    }
    return (
      <ConfirmPrompt
        title={t("replace.title", { name })}
        body={t("replace.body", { action: prompt.action, target: prompt.target, count })}
        cancelLabel={t("resume.keep")}
        confirmLabel={t("replace.confirm")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          setPending(null);
          prompt.run();
        }}
      >
        {storedDetails && (
          <Button variant="outline" size="sm" onClick={() => downloadPreset(storedDetails, storedComponents)}>
            <Download />
            {t("replace.export")}
          </Button>
        )}
      </ConfirmPrompt>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="kikx-dot-grid pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div data-tour="welcome" className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <h1 className="flex items-center gap-4 text-5xl font-semibold tracking-tight">
              <KikxMark className="size-12" />
              kikx
            </h1>
            <PronounceButton />
          </div>
          <p className="max-w-md text-balance text-muted-foreground">
            {t.rich("intro", { accent: (chunks) => <span className="kikx-highlight">{chunks}</span> })}
          </p>
        </div>

        {(pending || details) && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left text-sm shadow-sm">
            {pending ? (
              renderPrompt(pending)
            ) : details ? (
              <>
                <Link href="/build" className="flex min-w-48 flex-1 items-center gap-3 hover:underline-offset-4">
                  <IconTile icon={History} />
                  <span>
                    <span className="font-medium">{t("resume.continueTitle", { name: details.name })}</span>
                    <span className="block text-muted-foreground">{t("resume.kept", { count: components.length })}</span>
                  </span>
                </Link>
                <span className="flex items-center gap-1">
                  <IconButton
                    icon={X}
                    label={t("resume.discardLabel", { name: details.name })}
                    onClick={() => setPending({ kind: "discard" })}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href="/build">
                      {t("resume.continue")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </span>
              </>
            ) : null}
          </div>
        )}

        <ModeTabs className="w-full gap-8">
          <ModeTabsList data-tour="cli" className="self-center" />

          <TabsContent value="app" className="flex flex-col items-center gap-10">
            <TemplateGallery
              opening={opening}
              onSelect={(name, title) =>
                confirmReplace("template", title, () =>
                  open(name, async () => toPresetManifest(await api.preset(name)), name),
                )
              }
            />

            <div data-tour="new-project" className="w-full rounded-xl border bg-card p-6 text-left">
              <h2 className="text-sm font-medium">{t("build.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("build.body")}</p>
              <form data-teach="new-project-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
                <FieldGroup>
                  <FormField
                    label={t("build.projectName")}
                    registration={form.register("name")}
                    error={form.formState.errors.name}
                    placeholder={defaults.defaultProjectName}
                    description={t("build.settingsHint")}
                  />
                </FieldGroup>
                <Button type="submit" size="lg" className="mt-6 h-11 w-full">
                  <Sparkles className="size-4" />
                  {t("build.start")}
                </Button>
              </form>
            </div>

            <label data-tour="open-preset" htmlFor={presetInputId} className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed p-4 text-left text-sm hover:border-brand/40 hover:bg-muted/40">
              <span className="flex items-center gap-3">
                <IconTile icon={FolderOpen} />
                <span>
                  <span className="font-medium">{opening === "file" ? t("preset.opening") : t("preset.open")}</span>
                  <HelpTip term="preset" className="ml-1" />
                  <span className="block text-muted-foreground">
                    {t.rich("preset.body", { code: codeTag })}
                  </span>
                </span>
              </span>
              <input
                id={presetInputId}
                name="preset"
                type="file"
                accept=".json,application/json"
                className="sr-only"
                disabled={opening !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    confirmReplace("file", file.name, () =>
                      open("file", async () => parsePresetManifest(await file.text()), file.name.replace(/\.kikx-preset\.json$|\.json$/, "")),
                    );
                  }
                  e.target.value = "";
                }}
              />
            </label>

          </TabsContent>

          <TabsContent value="cli" className="flex flex-col gap-3 text-left">
            <p className="text-sm text-muted-foreground">{t("cli.body")}</p>
            <CliTerminal />
          </TabsContent>
        </ModeTabs>

        <Link
          href="/flow"
          className="flex items-center gap-1.5 text-sm text-brand underline-offset-4 hover:underline"
        >
          <Waypoints className="size-4" />
          {t("dataFlowLink")}
        </Link>
      </div>
    </main>
  );
}
