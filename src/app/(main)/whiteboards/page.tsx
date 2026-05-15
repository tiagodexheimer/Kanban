"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWhiteboards } from "@/hooks/use-omnitask";
import { WhiteboardView } from "@/components/whiteboard/whiteboard-view";
import { useViewStore } from "@/store/use-view-store";

export default function StandaloneWhiteboardsIndexPage() {
  const router = useRouter();
  const { setActiveBoardId } = useViewStore();

  const { data: whiteboards, isLoading } = useWhiteboards(undefined, undefined);

  useEffect(() => {
    setActiveBoardId(null);
  }, [setActiveBoardId]);

  useEffect(() => {
    // Filter out boards that belong to a Kanban board to get standalone ones
    const standaloneWBs = whiteboards?.filter(w => w.boardId === null) || [];
    
    if (!isLoading && standaloneWBs.length > 0) {
      // Redirect to the first standalone whiteboard
      router.replace(`/whiteboards/${standaloneWBs[0].id}`);
    }
  }, [whiteboards, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If no whiteboards exist, render WhiteboardView without an ID to show the empty state
  return <WhiteboardView />;
}
