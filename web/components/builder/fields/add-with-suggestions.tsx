import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** An "Add …" button followed by one-click chips for values the user probably wants next. */
export function AddWithSuggestions({
  addLabel,
  onAdd,
  suggestionsLabel,
  suggestions,
  onPick,
  children,
}: {
  addLabel: string;
  onAdd: () => void;
  suggestionsLabel: string;
  suggestions: string[];
  onPick: (suggestion: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus />
        {addLabel}
      </Button>
      {suggestions.length > 0 && (
        <>
          <span className="text-xs text-muted-foreground">{suggestionsLabel}</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onPick(suggestion)}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed px-2 font-mono text-xs text-muted-foreground hover:border-solid hover:text-foreground"
            >
              <Plus className="size-3" />
              {suggestion}
            </button>
          ))}
          {children}
        </>
      )}
    </div>
  );
}
