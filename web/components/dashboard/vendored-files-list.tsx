import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VendoredFile } from "@/lib/api-client";

export function VendoredFilesList({ files }: { dir: string; files: VendoredFile[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendored files</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing vendored yet — add a component below.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {files.map((file) => (
              <li
                key={file.fileName}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-mono">{file.fileName}</span>
                <Badge variant="outline">{file.component}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
