"use client";

import { useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  invalid,
  ordered,
  className,
  name,
  "aria-label": ariaLabel,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  invalid?: boolean;
  ordered?: boolean;
  className?: string;
  name?: string;
  "aria-label"?: string;
}) {
  const t = useTranslations("fields");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => !needle || s.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [suggestions, text, value]);

  const add = (raw: string) => {
    const items = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s, i, all) => all.indexOf(s) === i && !value.includes(s));
    if (items.length) onChange([...value, ...items]);
    setText("");
    setHighlight(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const typed = text.trim();
    const picked = open ? matches[highlight] : undefined;
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % matches.length);
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter" || event.key === "," || (event.key === "Tab" && typed)) {
      if (!typed && !(event.key === "Enter" && picked)) return;
      event.preventDefault();
      add(picked && (!typed || picked.toLowerCase().startsWith(typed.toLowerCase())) ? picked : typed);
    } else if (event.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-8 w-full cursor-text flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-1.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          invalid && "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50",
        )}
      >
        {value.map((item, index) => (
          <span
            key={item}
            className="inline-flex h-6 items-center gap-1 rounded-md bg-secondary pr-1 pl-2 font-mono text-xs text-secondary-foreground"
          >
            {ordered && <span className="text-muted-foreground">{index + 1}.</span>}
            {item}
            <button
              type="button"
              aria-label={t("removeItem", { item })}
              className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onChange(value.filter((v) => v !== item));
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          name={name}
          value={text}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && matches.length > 0}
          aria-invalid={invalid}
          role="combobox"
          placeholder={value.length ? undefined : placeholder}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (text.trim()) add(text);
            setOpen(false);
          }}
          onKeyDown={onKeyDown}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (/[,\s]/.test(pasted.trim())) {
              event.preventDefault();
              add(pasted);
            }
          }}
          className="h-6 min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {matches.map((match, index) => (
            <li
              key={match}
              role="option"
              aria-selected={index === highlight}
              onMouseDown={(event) => {
                event.preventDefault();
                add(match);
              }}
              onMouseEnter={() => setHighlight(index)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 font-mono text-xs",
                index === highlight && "bg-accent text-accent-foreground",
              )}
            >
              {match}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
