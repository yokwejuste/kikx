export function Panel({
  title,
  description,
  action,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={contentClassName ?? "p-6"}>{children}</div>
    </div>
  );
}
