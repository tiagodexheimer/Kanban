"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  useBoard, 
  useUpdateCard, 
  useCreateColumn,
  useUpdateColumn,
  useCreateBoard,
} from "@/hooks/use-omnitask";
import { useViewStore, ViewType } from "@/store/use-view-store";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/board/filter-bar";
import { OmnitaskBoard } from "@/components/board/omnitask-board";
import { ListView } from "@/components/board/list-view";
import { CalendarView } from "@/components/board/calendar-view";
import { CardModal } from "@/components/board/card-modal";
import { DashboardView } from "@/components/board/dashboard-view";
import { ActivityLog } from "@/components/board/activity-log";
import { BoardSettingsModal } from "@/components/board/board-settings-modal";
import { History, Settings, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  const searchParams = useSearchParams();
  const router = useRouter();

  // In this new architecture, the tab (kanban, list, calendar) is managed by ?tab=
  const currentTab = (searchParams.get("tab") as ViewType) || "board";

  const { data: board, isLoading: isLoadingBoard, error } = useBoard(boardId);
  const updateCardMutation = useUpdateCard();
  const createColumnMutation = useCreateColumn();
  const updateColumnMutation = useUpdateColumn();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalData, setModalData] = useState<{ cardId?: string; columnId?: string }>({});

  const { filters, setActiveBoardId } = useViewStore();

  useEffect(() => {
    // Keep Zustand activeBoardId in sync just in case other components (like Sidebar) need it
    setActiveBoardId(boardId);
  }, [boardId, setActiveBoardId]);



  const openEditModal = (cardId: string, columnId: string) => {
    setModalData({ cardId, columnId });
    setIsModalOpen(true);
  };

  const openCreateModal = (columnId: string) => {
    setModalData({ columnId });
    setIsModalOpen(true);
  };

  // Filter and Sort Data
  const filteredColumns = useMemo(() => {
    if (!board) return [];

    return board.columns.map(col => {
      const filteredCards = col.cards.filter(card => {
        // Search filter
        if (filters.search && !card.title.toLowerCase().includes(filters.search.toLowerCase()) && 
            !card.description?.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        // Priority filter
        if (filters.priorities.length > 0 && !filters.priorities.includes(card.priority)) {
          return false;
        }

        // Tag filter
        if (filters.tags.length > 0) {
          const cardTagIds = card.tags.map(t => t.id);
          if (!filters.tags.some(tagId => cardTagIds.includes(tagId))) {
            return false;
          }
        }

        return true;
      });

      return {
        ...col,
        cards: filteredCards
      };
    });
  }, [board, filters]);

  if (isLoadingBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <h2 className="text-2xl font-bold">Quadro não encontrado</h2>
        <p className="text-muted-foreground">O quadro que você está procurando não existe ou você não tem acesso.</p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{board.title}</h1>
          <p className="text-muted-foreground">{board.description || "Visualize e organize suas tarefas."}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}
            className={cn(
              "p-2 rounded-xl border transition-all flex items-center gap-2",
              isActivityLogOpen 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-background border-border text-muted-foreground hover:bg-accent"
            )}
            title="Histórico de atividades"
          >
            <History size={18} />
            <span className="text-sm font-medium">Histórico</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:bg-accent transition-all flex items-center gap-2"
            title="Configurações do quadro"
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Configurações</span>
          </button>
        </div>
      </header>

      <FilterBar tags={board.tags} />

      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar mt-4">
        {currentTab === "board" && (
          <OmnitaskBoard 
            columns={filteredColumns} 
            boardId={boardId}
            onEditCard={openEditModal}
            onAddCard={openCreateModal}
            onUpdateCard={updateCardMutation.mutate}
            onUpdateColumn={updateColumnMutation.mutate}
          />
        )}

        {currentTab === "list" && (
          <ListView 
            columns={filteredColumns}
            onEditCard={openEditModal}
            customFields={board.customFields || []}
          />
        )}

        {currentTab === "calendar" && (
          <CalendarView 
            columns={filteredColumns}
            onEditCard={openEditModal}
          />
        )}

        {currentTab === "dashboard" && (
          <DashboardView boardId={boardId} />
        )}
      </div>

      {/* Activity Log Side Panel */}
      {isActivityLogOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-2xl z-50 animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <History size={18} className="text-primary" /> 
              Histórico
            </h3>
            <button 
              onClick={() => setIsActivityLogOpen(false)}
              className="p-1 hover:bg-accent rounded-md"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-0 overflow-y-auto h-[calc(100vh-65px)]">
            <ActivityLog boardId={boardId} />
          </div>
        </div>
      )}

      {/* Modals */}
      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        boardId={boardId}
        columnId={modalData.columnId!}
        cardId={modalData.cardId}
        projectId={board?.projectId}
      />

      <BoardSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        boardId={boardId}
      />
    </div>
  );
}
