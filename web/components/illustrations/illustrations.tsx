import { cn } from "@/lib/utils";

const DOTTED = "0.1 10";

function Illustration({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-24 w-auto shrink-0 text-foreground", className)}
    >
      {children}
    </svg>
  );
}

function Faint({ children }: { children: React.ReactNode }) {
  return <g opacity={0.35}>{children}</g>;
}

function Ball({ cx, cy, r = 10 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
}

export function EmptyProjectIllustration({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <Faint>
        <path d="M28 60H52M20 72H52M28 84H52" />
        <path d="M118 30V24H140L146 30" />
        <rect x="110" y="30" width="74" height="62" rx="10" strokeDasharray="8 8" />
        <path d="M86 68Q98 56 106 62" strokeDasharray={DOTTED} />
      </Faint>
      <Ball cx={72} cy={72} />
    </Illustration>
  );
}

export function DiagramIllustration({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect x="20" y="18" width="52" height="28" rx="7" />
      <Faint>
        <rect x="128" y="18" width="52" height="28" rx="7" />
        <rect x="74" y="76" width="52" height="28" rx="7" />
        <path d="M72 32H128" strokeDasharray="8 8" />
        <path d="M46 46V90H74" strokeDasharray="8 8" />
        <path d="M154 46V90H126" strokeDasharray="8 8" />
      </Faint>
      <Ball cx={46} cy={32} r={5} />
    </Illustration>
  );
}

export function ChecksClearIllustration({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <path d="M30 60L46 76L76 42" strokeWidth={5} />
      <Faint>
        <path d="M86 66Q104 44 118 54" strokeDasharray={DOTTED} />
      </Faint>
      <path d="M150 22H176V98H150" />
      <Ball cx={138} cy={62} r={11} />
    </Illustration>
  );
}

export function ChecksEmptyIllustration({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <Faint>
        <path d="M76 48H100M76 60H94" />
      </Faint>
      <circle cx="88" cy="54" r="26" />
      <path d="M107 73L128 94" strokeWidth={6} />
    </Illustration>
  );
}

export function PreviewIllustration({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect x="72" y="14" width="56" height="92" rx="9" />
      <path d="M86 36H114" />
      <Faint>
        <path d="M86 52H108M86 68H112M86 84H100" />
      </Faint>
    </Illustration>
  );
}

export function NotFoundIllustration({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <Faint>
        <path d="M22 106Q70 -6 116 18" strokeDasharray={DOTTED} />
      </Faint>
      <path d="M150 34H178V106H150" />
      <Ball cx={132} cy={20} r={11} />
    </Illustration>
  );
}
