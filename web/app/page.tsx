"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useErrorText } from "@/lib/i18n/use-error-text";
import { PronounceButton } from "@/components/common/pronounce-button";
import { ArrowRight, Copy, FolderOpen, History, Sparkles, Waypoints, X } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/builder/fields/form-field";
import { useProject } from "@/lib/project/context";
import { initFormSchema, type InitFormValues } from "@/lib/forms/schemas";
import { api } from "@/lib/api/client";
import { loadPresetManifest, parsePresetManifest, toPresetManifest, type PresetManifest } from "@/lib/project/preset";
import { projectDefaults } from "@/lib/registry/store";
import { RegistryGate } from "@/components/layout/registry-gate";
import { TemplateGallery } from "@/components/home/template-gallery";
import { KikxMark } from "@/components/common/kikx-mark";
import { useFirstVisitTour } from "@/lib/tour/use-tour";

const SNIPPET = [
  { cmd: "curl -fsSL https://raw.githubusercontent.com/yokwejuste/kikx/main/install.sh | bash" },
  { cmd: "kikx init --name <project>" },
  { cmd: "kikx presets" },
  { cmd: "kikx setup <template>" },
  { cmd: "kikx list" },
  { cmd: "kikx add <category>/<component> --name <name> --set key=value" },
  { cmd: "kikx apply ./<project>.kikx-preset.json" },
];

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
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  useFirstVisitTour("home");

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

  const form = useForm<InitFormValues>({
    resolver: zodResolver(initFormSchema),
    defaultValues: { name: "", namespace: defaults.defaultNamespace, dir: defaults.defaultOutputDir },
  });

  function onSubmit(values: InitFormValues) {
    reset();
    setDetails({ name: values.name, namespace: values.namespace, outputDir: values.dir });
    router.push("/build");
  }

  return (
    <main className="relative flex flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div data-tour="welcome" className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <h1 className="flex items-center gap-4 text-5xl font-semibold tracking-tight">
              <KikxMark className="size-12" />
              kikx
            </h1>
            <PronounceButton />
          </div>
          <p className="max-w-md text-balance text-muted-foreground">{t("intro")}</p>
        </div>

        {details && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left text-sm shadow-sm">
            {confirmingDiscard ? (
              <>
                <span>
                  <span className="font-medium">{t("resume.confirmTitle", { name: details.name })}</span>
                  <span className="block text-muted-foreground">
                    {t("resume.confirmBody", { count: components.length })}
                  </span>
                </span>
                <span className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDiscard(false)}>
                    {t("resume.keep")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      reset();
                      setConfirmingDiscard(false);
                      toast.success(t("resume.discarded", { name: details.name }));
                    }}
                  >
                    {t("resume.discard")}
                  </Button>
                </span>
              </>
            ) : (
              <>
                <Link href="/build" className="flex min-w-48 flex-1 items-center gap-3 hover:underline-offset-4">
                  <History className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{t("resume.continueTitle", { name: details.name })}</span>
                    <span className="block text-muted-foreground">{t("resume.kept", { count: components.length })}</span>
                  </span>
                </Link>
                <span className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("resume.discardLabel", { name: details.name })}
                    title={t("resume.discardLabel", { name: details.name })}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setConfirmingDiscard(true)}
                  >
                    <X className="size-4" />
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/build">
                      {t("resume.continue")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </span>
              </>
            )}
          </div>
        )}

        <div data-tour="cli" className="w-full overflow-hidden rounded-xl border bg-card text-left shadow-sm">
          <div className="flex items-center gap-1.5 border-b bg-muted/40 py-1.5 pr-1.5 pl-4">
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <CopyButton
              text={SNIPPET.map((line) => line.cmd).join("\n")}
              size="icon"
              aria-label={t("copyCommands")}
              title={t("copyCommands")}
              className="ml-auto size-7 text-muted-foreground hover:text-foreground"
            >
              <Copy className="size-3.5" />
            </CopyButton>
          </div>
          <div className="flex flex-col gap-2.5 p-4 font-mono text-sm">
            {SNIPPET.map((line) => (
              <div key={line.cmd} className="flex gap-2">
                <span className="select-none text-muted-foreground">$</span>
                <span className="min-w-0 flex-1 break-words">{line.cmd}</span>
              </div>
            ))}
          </div>
        </div>

        <TemplateGallery
          opening={opening}
          onSelect={(name) => open(name, async () => toPresetManifest(await api.preset(name)), name)}
        />

        <div data-tour="new-project" className="w-full rounded-xl border bg-card p-6 text-left">
          <h2 className="text-sm font-medium">{t("build.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("build.body")}</p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
            <FieldGroup>
              <FormField
                label={t("build.projectName")}
                registration={form.register("name")}
                error={form.formState.errors.name}
                placeholder="my-app"
              />
              <FormField
                label={t("build.namespace")}
                registration={form.register("namespace")}
                error={form.formState.errors.namespace}
              />
              <FormField
                label={t("build.outputDir")}
                registration={form.register("dir")}
                error={form.formState.errors.dir}
              />
            </FieldGroup>
            <Button type="submit" size="lg" className="mt-6 h-11 w-full">
              <Sparkles className="size-4" />
              {t("build.start")}
            </Button>
          </form>
        </div>

        <label data-tour="open-preset" className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed p-4 text-left text-sm hover:bg-muted/40">
          <span className="flex items-center gap-3">
            <FolderOpen className="size-4 text-muted-foreground" />
            <span>
              <span className="font-medium">{opening === "file" ? t("preset.opening") : t("preset.open")}</span>
              <span className="block text-muted-foreground">
                {t.rich("preset.body", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
              </span>
            </span>
          </span>
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={opening !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                open("file", async () => parsePresetManifest(await file.text()), file.name.replace(/\.kikx-preset\.json$|\.json$/, ""));
              }
              e.target.value = "";
            }}
          />
        </label>

        <Link
          href="/flow"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Waypoints className="size-4" />
          {t("dataFlowLink")}
        </Link>
      </div>
    </main>
  );
}
