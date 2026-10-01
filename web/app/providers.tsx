"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ProjectProvider } from "@/lib/project/context";
import { TeachProvider } from "@/components/teach/teach-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ProjectProvider>
          <TeachProvider>{children}</TeachProvider>
          <Toaster />
        </ProjectProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
