import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProjectDetails } from "@/lib/project-context";

export function TopBar({ details }: { details: ProjectDetails }) {
  return (
    <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">{details.name}</h1>
        <div className="hidden items-center gap-1.5 sm:flex">
          <Badge variant="secondary" className="font-mono text-xs font-normal">
            {details.namespace}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs font-normal">
            {details.outputDir}/
          </Badge>
        </div>
      </div>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        Start over
      </Link>
    </div>
  );
}
