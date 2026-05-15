"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDocs } from "@/hooks/use-omnitask";
import { DocsView } from "@/components/docs/docs-view";

export default function DocsIndexPage() {
  const router = useRouter();

  const { data: docs, isLoading } = useDocs(undefined, undefined);

  useEffect(() => {
    if (!isLoading && docs && docs.length > 0) {
      // Redirect to the first document
      router.replace(`/docs/${docs[0].id}`);
    }
  }, [docs, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If no docs exist, render DocsView without an ID to show the empty state
  return <DocsView />;
}
