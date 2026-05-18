import React, { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Suspense fallback={<div className="w-64 bg-card border-r border-border h-full shrink-0 animate-pulse" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col h-full bg-background p-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
