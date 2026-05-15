"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { WhiteboardView } from "@/components/whiteboard/whiteboard-view";
import { useViewStore } from "@/store/use-view-store";

export default function BoardWhiteboardPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  const whiteboardId = params.whiteboardId as string;
  const { setActiveBoardId } = useViewStore();

  useEffect(() => {
    setActiveBoardId(boardId);
  }, [boardId, setActiveBoardId]);

  return (
    <div className="flex-1 flex-col min-h-0 flex h-full">
      <WhiteboardView boardId={boardId} whiteboardId={whiteboardId} />
    </div>
  );
}
