import { cn } from "@/lib/utils";

export function KikxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      stroke="currentColor"
      strokeWidth={16}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <g transform="translate(-7 0)">
        <path d="M30 14V114" />
        <path d="M30 80L76 34" />
        <path d="M50 62L74 100H86" />
        <circle cx="108" cy="100" r="12" stroke="none" className="fill-current dark:fill-volt" />
      </g>
    </svg>
  );
}
