"use client";

import React from "react";
import { useParams } from "next/navigation";
import { DocsView } from "@/components/docs/docs-view";

export default function StandaloneDocPage() {
  const params = useParams();
  const docId = params.docId as string;

  return (
    <div className="flex-1 flex-col min-h-0 flex h-full">
      <DocsView docId={docId} />
    </div>
  );
}
