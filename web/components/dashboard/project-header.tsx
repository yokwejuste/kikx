import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/lib/api-client";

export function ProjectHeader({ project }: { project: ProjectSummary }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{project.name}</h1>
        <Badge variant="secondary">namespace: {project.defaultNamespace}</Badge>
        <Badge variant="secondary">output: {project.outputDir}</Badge>
      </CardContent>
    </Card>
  );
}
