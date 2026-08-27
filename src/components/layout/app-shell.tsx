import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:pl-sidebar">
        <TopBar />
        <main className="mx-auto w-full max-w-(--container-shell) flex-1 px-gutter pt-stack-sm pb-stack-lg md:px-edge">
          {children}
        </main>
      </div>
    </div>
  );
}
