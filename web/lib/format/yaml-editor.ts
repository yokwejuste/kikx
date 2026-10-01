import { EditorSelection, EditorState, StateEffect, StateField, Text, type Extension } from "@codemirror/state";
import { Decoration, EditorView, keymap, placeholder, type DecorationSet } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from "@codemirror/commands";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { yamlLanguage } from "@codemirror/lang-yaml";
import { tags } from "@lezer/highlight";
import { formatYaml, nextLineIndent } from "@/lib/format/yaml";

export interface MarkedRange {
  from: number;
  to: number;
}

export const setMarkedRanges = StateEffect.define<MarkedRange[]>();

const problemMark = Decoration.mark({ class: "cm-format-problem" });

function markRanges(ranges: MarkedRange[], length: number): DecorationSet {
  const marks = ranges.flatMap(({ from, to }) => {
    const start = Math.min(from, Math.max(length - 1, 0));
    const end = Math.min(Math.max(to, start + 1), length);
    return end > start ? [problemMark.range(start, end)] : [];
  });
  return Decoration.set(marks, true);
}

const markedRanges = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(marks, transaction) {
    let next = marks.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(setMarkedRanges)) next = markRanges(effect.value, transaction.state.doc.length);
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const token = (name: string) => `var(--syntax-token-${name})`;

const highlightStyle = HighlightStyle.define([
  { tag: tags.definition(tags.propertyName), color: token("keyword") },
  { tag: [tags.string, tags.special(tags.string), tags.content], color: token("string") },
  { tag: [tags.labelName, tags.typeName, tags.keyword, tags.attributeValue, tags.meta], color: token("constant") },
  { tag: [tags.separator, tags.punctuation, tags.squareBracket, tags.brace], color: token("punctuation") },
  { tag: tags.lineComment, color: token("comment"), fontStyle: "italic" },
]);

const theme = EditorView.theme({
  "&": { flex: "1", minWidth: "0", backgroundColor: "transparent", color: "var(--syntax-foreground)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "var(--syntax-line-height)" },
  ".cm-content": { padding: "var(--syntax-block-padding)", caretColor: "var(--foreground)" },
  ".cm-line": { padding: "var(--syntax-line-padding)" },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
  ".cm-content ::selection": { backgroundColor: "var(--syntax-selection)" },
  ".cm-format-problem": {
    backgroundColor: "var(--syntax-problem)",
    textDecoration: "underline wavy var(--destructive)",
    textDecorationSkipInk: "none",
    textUnderlineOffset: "var(--syntax-underline-offset)",
  },
});

function newlineWithIndent(view: EditorView): boolean {
  const { state } = view;
  const change = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    const insert = state.lineBreak + nextLineIndent(line.text.slice(0, range.from - line.from));
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.cursor(range.from + insert.length),
    };
  });
  view.dispatch(state.update(change, { scrollIntoView: true, userEvent: "input" }));
  return true;
}

function leadingSpaces(text: string): number {
  return text.length - text.trimStart().length;
}

function tidyDocument(view: EditorView): void {
  const text = view.state.doc.toString();
  const formatted = formatYaml(text);
  if (formatted === text) return;
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  const doc = Text.of(formatted.split("\n"));
  const target = doc.line(Math.min(line.number, doc.lines));
  const column = head - line.from - leadingSpaces(line.text) + leadingSpaces(target.text);
  view.dispatch({
    changes: { from: 0, to: text.length, insert: doc },
    selection: EditorSelection.cursor(target.from + Math.min(Math.max(column, 0), target.length)),
    userEvent: "input.format",
  });
}

export function replaceDocument(view: EditorView, text: string, userEvent?: string): void {
  if (view.state.doc.toString() === text) return;
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, userEvent });
}

export function exposeValue(view: EditorView): void {
  Object.defineProperty(view.contentDOM, "value", {
    configurable: true,
    get: () => view.state.doc.toString(),
    set: (text: string) => replaceDocument(view, text, "input.type"),
  });
}

export function yamlEditorState({
  doc,
  hint,
  attributes,
  onChange,
  onBlur,
}: {
  doc: string;
  hint: string;
  attributes: Record<string, string>;
  onChange: (text: string) => void;
  onBlur: () => void;
}): EditorState {
  const extensions: Extension[] = [
    yamlLanguage,
    syntaxHighlighting(highlightStyle),
    indentUnit.of("  "),
    EditorState.tabSize.of(2),
    history(),
    keymap.of([
      { key: "Enter", run: newlineWithIndent },
      { key: "Tab", run: indentMore, shift: indentLess },
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    placeholder(hint),
    markedRanges,
    theme,
    EditorView.contentAttributes.of({ spellcheck: "false", autocorrect: "off", autocapitalize: "off", ...attributes }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString());
      if (update.transactions.some((transaction) => transaction.isUserEvent("input.paste"))) {
        setTimeout(() => tidyDocument(update.view));
      }
    }),
    EditorView.domEventHandlers({
      blur: (_event, view) => {
        tidyDocument(view);
        onBlur();
      },
    }),
  ];
  return EditorState.create({ doc, extensions });
}
