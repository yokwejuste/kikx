function LineSample({ dashed }: { dashed?: boolean }) {
  return (
    <svg width="28" height="8" aria-hidden>
      <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dashed ? "5 4" : undefined} />
    </svg>
  );
}

export function DiagramLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <LineSample />
        uses / targets
      </span>
      <span className="flex items-center gap-1.5">
        <LineSample dashed />
        inventory structure
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded-sm border border-dashed border-current" />
        data (groups, vars)
      </span>
    </div>
  );
}
