"use client";

import React, { useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  sortableKeyboardCoordinates, 
  SortableContext, 
  horizontalListSortingStrategy 
} from "@dnd-kit/sortable";
import { 
  useBoards, 
  useBoard, 
  useUpdateCard, 
  useCreateColumn,
  useUpdateColumn,
  Column as ColumnType
} from "@/hooks/use-kanban";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "./column";
import { Card } from "./card";
import { CardModal } from "./card-modal";
import { createPortal } from "react-dom";
import { useEffect } from "react";

export function BoardView() {
  const { data: boards, isLoading: isLoadingBoards } = useBoards();
  const boardId = boards?.[0]?.id;
  
  const { data: board, isLoading: isLoadingBoard } = useBoard(boardId!);
  const updateCardMutation = useUpdateCard();
  const createColumnMutation = useCreateColumn();

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ cardId?: string; columnId?: string }>({});
  
  // Local state for smooth column reordering
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);

  // Update local columns when board data changes
  useEffect(() => {
    if (board?.columns) {
      setLocalColumns(board.columns);
    }
  }, [board?.columns]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateColumnMutation = useUpdateColumn();

  if (isLoadingBoards || (boardId && isLoadingBoard)) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground italic">Carregando quadro...</div>;
  }

  if (!board) {
    const handleCreateFirstBoard = async () => {
      const title = prompt("Título do seu novo quadro:");
      if (title) {
        const res = await fetch("/api/boards", {
          method: "POST",
          body: JSON.stringify({ title, description: "Meu novo workspace" }),
        });
        if (res.ok) {
          window.location.reload();
        }
      }
    };

    return (
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
    );
  }

  const openEditModal = (cardId: string, columnId: string) => {
    setModalData({ cardId, columnId });
    setIsModalOpen(true);
  };

  const openCreateModal = (columnId: string) => {
    setModalData({ columnId });
    setIsModalOpen(true);
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Column') {
      setActiveColumnId(active.id as string);
    } else {
      setActiveCardId(active.id as string);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'Column' && overType === 'Column') {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    if (activeType === 'Column') return;

    const activeCard = board?.columns.flatMap(c => c.cards).find(c => c.id === activeId);
    if (!activeCard) return;

    const isOverACard = !!board?.columns.flatMap(c => c.cards).find(c => c.id === overId);
    const isOverAColumn = !!board?.columns.find(c => c.id === overId);

    if (isOverACard) {
      const overCard = board?.columns.flatMap(c => c.cards).find(c => c.id === overId);
      if (overCard && activeCard.columnId !== overCard.columnId) {
        updateCardMutation.mutate({ id: activeId, columnId: overCard.columnId, position: overCard.position });
      }
    } else if (isOverAColumn) {
      if (activeCard.columnId !== overId) {
        updateCardMutation.mutate({ id: activeId, columnId: overId, position: 0 });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) {
      setActiveCardId(null);
      setActiveColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;

    if (activeType === 'Column') {
      if (activeId !== overId) {
        const oldIndex = localColumns.findIndex((i) => i.id === activeId);
        const newIndex = localColumns.findIndex((i) => i.id === overId);
        const newOrder = arrayMove(localColumns, oldIndex, newIndex);
        
        // Persist new positions for all affected columns
        newOrder.forEach((col, index) => {
          if (col.position !== index) {
            updateColumnMutation.mutate({ id: col.id, position: index });
          }
        });
      }
    } else {
      const activeCard = board?.columns.flatMap(c => c.cards).find(c => c.id === activeId);
      const overCard = board?.columns.flatMap(c => c.cards).find(c => c.id === overId);

      if (activeCard && overCard && activeCard.columnId === overCard.columnId) {
        if (activeId !== overId) {
          updateCardMutation.mutate({ id: activeId, position: overCard.position });
        }
      }
    }

    setActiveCardId(null);
    setActiveColumnId(null);
  }

  const columnsToRender = localColumns.length > 0 ? localColumns : (board?.columns || []);
  const columnIds = columnsToRender.map(c => c.id);
  const allCards = board.columns.flatMap(c => c.cards);
  const activeCard = allCards.find(c => c.id === activeCardId);
  const activeColumn = columnsToRender.find(c => c.id === activeColumnId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full pb-8 overflow-x-auto custom-scrollbar">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {columnsToRender.map(column => (
            <Column 
              key={column.id} 
              column={column} 
              cards={column.cards} 
              onEditCard={(cardId) => openEditModal(cardId, column.id)}
              onAddCard={() => openCreateModal(column.id)}
            />
          ))}
        </SortableContext>
        
        <button 
          onClick={handleAddColumn}
          className="w-80 shrink-0 h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:text-primary transition-all text-muted-foreground font-medium"
        >
          + Adicionar Lista
        </button>
      </div>

      <CardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cardId={modalData.cardId}
        columnId={modalData.columnId}
      />

      {typeof document !== 'undefined' && createPortal(
        <DragOverlay>
          {activeCard ? <Card card={activeCard} /> : null}
          {activeColumn ? (
            <Column 
              column={activeColumn} 
              cards={activeColumn.cards} 
              onEditCard={() => {}} 
              onAddCard={() => {}} 
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
