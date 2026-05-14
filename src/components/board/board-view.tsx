"use client";

import React, { useState, useMemo } from "react";
import { 
  useBoards, 
  useBoard, 
  useUpdateCard, 
  useCreateColumn,
  useUpdateColumn,
  useCreateBoard,
  Column as ColumnType,
  Card as CardType
} from "@/hooks/use-omnitask";
import { useViewStore } from "@/store/use-view-store";
import { cn } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { OmnitaskBoard } from "./omnitask-board";
import { ListView } from "./list-view";
import { CalendarView } from "./calendar-view";
import { CardModal } from "./card-modal";
import { DashboardView } from "./dashboard-view";
import { ActivityLog } from "./activity-log";
import { BoardSettingsModal } from "./board-settings-modal";
import { History, X, Settings } from "lucide-react";
import { DocsView } from "../docs/docs-view";

export function BoardView() {
  const { data: boards, isLoading: isLoadingBoards } = useBoards();
  const { activeBoardId, currentView, filters } = useViewStore();
  
  const boardId = activeBoardId || boards?.[0]?.id;
  const { data: board, isLoading: isLoadingBoard } = useBoard(boardId!);
  const updateCardMutation = useUpdateCard();
  const createColumnMutation = useCreateColumn();
  const updateColumnMutation = useUpdateColumn();
  const createBoardMutation = useCreateBoard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalData, setModalData] = useState<{ cardId?: string; columnId?: string }>({});

  const handleAddColumn = () => {
    const title = prompt("Título da nova lista:");
    if (title && boardId && board) {
      createColumnMutation.mutate({ 
        title, 
        boardId, 
        position: board.columns.length + 1 
      });
    }
  };

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
        const matchesSearch = filters.search === "" || 
          card.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          card.description?.toLowerCase().includes(filters.search.toLowerCase());

        // Priority filter
        const matchesPriority = filters.priorities.length === 0 || 
          filters.priorities.includes(card.priority);

        // Tags filter
        const matchesTags = filters.tags.length === 0 || 
          card.tags.some(tag => filters.tags.includes(tag.id));

        return matchesSearch && matchesPriority && matchesTags;
      });

      return { ...col, cards: filteredCards };
    });
  }, [board, filters]);

  if (isLoadingBoards || (boardId && isLoadingBoard)) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground italic">Carregando quadro...</div>;
  }

  const handleCreateFirstBoard = async () => {
    const title = prompt("Título do seu novo quadro:");
    if (title) {
      createBoardMutation.mutate({ 
        title, 
        description: "Meu novo workspace" 
      }, {
        onSuccess: () => {
          window.location.reload();
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {currentView === "docs" ? (
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
          <DocsView boardId={boardId} />
        </div>
      ) : !board ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Nenhum quadro encontrado</h2>
            <p className="text-muted-foreground">Parece que seu workspace está vazio. Vamos começar?</p>
          </div>
          <button 
            onClick={handleCreateFirstBoard}
            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
          >
            Criar Meu Primeiro Quadro
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
        {currentView === "board" && (
          <OmnitaskBoard 
            columns={filteredColumns} 
            boardId={boardId!}
            onEditCard={openEditModal}
            onAddCard={openCreateModal}
            onAddColumn={handleAddColumn}
            onUpdateCard={updateCardMutation.mutate}
            onUpdateColumn={updateColumnMutation.mutate}
          />
        )}

        {currentView === "list" && (
          <ListView 
            columns={filteredColumns}
            onEditCard={openEditModal}
            customFields={board.customFields || []}
          />
        )}

        {currentView === "calendar" && (
          <CalendarView 
            columns={filteredColumns}
            onEditCard={openEditModal}
          />
        )}

        {currentView === "dashboard" && (
          <DashboardView boardId={boardId!} />
        )}
      </div>

      {/* Activity Log Side Panel */}
      {isActivityLogOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-2xl z-50 animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <History size={18} />
              Atividade do Quadro
            </h2>
            <button 
              onClick={() => setIsActivityLogOpen(false)}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
            <ActivityLog boardId={boardId} maxHeight="calc(100vh - 120px)" />
          </div>
        </div>
      )}

      <CardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cardId={modalData.cardId}
        columnId={modalData.columnId}
        boardId={boardId}
      />

      {boardId && (
        <BoardSettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          boardId={boardId}
        />
      )}
    </div>
  );
}
