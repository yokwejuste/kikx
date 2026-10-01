"use client";

import { useRef } from "react";
import { complete } from "@/lib/teach/cli/complete";
import { freshCursor, stepHistory, type HistoryCursor } from "@/lib/teach/cli/history";
import { controlAction, editLine } from "@/lib/teach/cli/line-edit";
import { cliSession } from "@/lib/teach/cli/session";

const HISTORY_KEYS: Record<string, "older" | "newer"> = { ArrowUp: "older", ArrowDown: "newer" };

function setLine(input: HTMLInputElement, value: string, cursor: number): void {
  input.value = value;
  input.setSelectionRange(cursor, cursor);
}

const hasSelection = (input: HTMLInputElement): boolean =>
  input.selectionStart !== input.selectionEnd || !(window.getSelection()?.isCollapsed ?? true);

export function useShellInput(busy: boolean) {
  const input = useRef<HTMLInputElement>(null);
  const history = useRef<HistoryCursor>(freshCursor());
  const pendingTab = useRef<string | null>(null);

  const submit = () => {
    const element = input.current;
    if (!element || busy) return;
    const command = element.value;
    setLine(element, "", 0);
    history.current = freshCursor();
    void cliSession.execute(command);
  };

  const interrupt = (element: HTMLInputElement) => {
    cliSession.echo(element.value, [], true);
    setLine(element, "", 0);
    history.current = freshCursor();
  };

  const recall = (element: HTMLInputElement, direction: "older" | "newer") => {
    const step = stepHistory(cliSession.history(), history.current, direction, element.value);
    if (!step) return;
    history.current = step.cursor;
    setLine(element, step.line, step.line.length);
  };

  const tab = async (element: HTMLInputElement) => {
    const line = element.value;
    const cursor = element.selectionStart ?? line.length;
    const result = await complete(line, cursor, cliSession.completionSources());
    if (element.value !== line) return;
    if (result.line !== line || result.cursor !== cursor) setLine(element, result.line, result.cursor);
    if (result.matches.length < 2) {
      pendingTab.current = null;
    } else if (result.line === line && pendingTab.current === line) {
      pendingTab.current = null;
      cliSession.echo(line, [[{ text: result.matches.join("  ") }]]);
    } else {
      pendingTab.current = result.line;
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const element = event.currentTarget;
    if (event.nativeEvent.isComposing) return;
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
    if (event.key !== "Tab") pendingTab.current = null;
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key === "Tab" && plain && element.value) {
      event.preventDefault();
      void tab(element);
      return;
    }
    if (plain && event.key in HISTORY_KEYS) {
      event.preventDefault();
      recall(element, HISTORY_KEYS[event.key]);
      return;
    }
    if (!event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "c") {
      if (hasSelection(element)) return;
      event.preventDefault();
      interrupt(element);
      return;
    }
    if (key === "l") {
      event.preventDefault();
      cliSession.clearScreen();
      return;
    }
    const action = controlAction(key);
    if (!action) return;
    event.preventDefault();
    const edited = editLine(action, {
      value: element.value,
      start: element.selectionStart ?? element.value.length,
      end: element.selectionEnd ?? element.value.length,
    });
    setLine(element, edited.value, edited.cursor);
  };

  return { input, onKeyDown, submit };
}
