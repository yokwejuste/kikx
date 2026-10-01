"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { EditorView } from "@codemirror/view";
import { FieldError } from "@/components/ui/field";
import { checkYaml } from "@/lib/format/yaml";
import { exposeValue, replaceDocument, setMarkedRanges, yamlEditorState } from "@/lib/format/yaml-editor";
import type { YamlEditorProps } from "@/components/builder/fields/format/yaml-field";

export default function YamlEditor({
  value,
  onChange,
  onBlur,
  focusRef,
  label,
  placeholder,
  teach,
  invalid,
  frameClassName,
}: YamlEditorProps) {
  const t = useTranslations("formatting");
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ value, onChange, onBlur, focusRef, label, placeholder, teach });
  const problems = useMemo(() => checkYaml(value), [value]);

  useEffect(() => {
    latest.current = { value, onChange, onBlur, focusRef, label, placeholder, teach };
  });

  useEffect(() => {
    const initial = latest.current;
    const attributes: Record<string, string> = { "aria-label": initial.label, "aria-multiline": "true" };
    if (initial.teach) attributes["data-teach"] = initial.teach;
    const editor = new EditorView({
      parent: host.current!,
      state: yamlEditorState({
        doc: initial.value,
        hint: initial.placeholder ?? "",
        attributes,
        onChange: (text) => latest.current.onChange(text),
        onBlur: () => latest.current.onBlur(),
      }),
    });
    exposeValue(editor);
    view.current = editor;
    initial.focusRef({ focus: () => editor.focus() });
    return () => {
      view.current = null;
      editor.destroy();
    };
  }, []);

  useEffect(() => {
    if (view.current) replaceDocument(view.current, value);
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: setMarkedRanges.of(problems) });
  }, [problems]);

  useEffect(() => {
    view.current?.contentDOM.setAttribute("aria-invalid", String(!!invalid || problems.length > 0));
  }, [invalid, problems.length]);

  return (
    <>
      <div ref={host} data-invalid={!!invalid || problems.length > 0} className={frameClassName} />
      <FieldError
        className="text-xs"
        errors={problems.map((problem) => ({
          message: t("yamlProblem", { line: problem.line, reason: t(`yamlReasons.${problem.reason}`) }),
        }))}
      />
    </>
  );
}
