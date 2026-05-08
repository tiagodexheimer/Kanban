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
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  sortableKeyboardCoordinates, 
  SortableContext, 
  horizontalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useBoards, useBoard, useUpdateCard, useCreateCard } from "@/hooks/use-kanban";
import { Column } from "./column";
import { Card } from "./card";
import { CardModal } from "./card-modal";
import { createPortal } from "react-dom";

export function BoardView() {
  const { data: boards, isLoading: isLoadingBoards } = useBoards();
  const boardId = boards?.[0]?.id;
  
  const { data: board, isLoading: isLoadingBoard } = useBoard(boardId!);
  const updateCardMutation = useUpdateCard();

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ cardId?: string; columnId?: string }>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoadingBoards || (boardId && isLoadingBoard)) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground italic">Carregando quadro...</div>;
  }

  if (!board) {
    return <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">Nenhum quadro encontrado. Crie um para começar.</div>;
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
    setActiveCardId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

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
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = board?.columns.flatMap(c => c.cards).find(c => c.id === activeId);
    const overCard = board?.columns.flatMap(c => c.cards).find(c => c.id === overId);

    if (activeCard && overCard && activeCard.columnId === overCard.columnId) {
      if (activeId !== overId) {
        updateCardMutation.mutate({ id: activeId, position: overCard.position });
      }
    }

    setActiveCardId(null);
  }

  const columnIds = board.columns.map(c => c.id);
  const allCards = board.columns.flatMap(c => c.cards);
  const activeCard = allCards.find(c => c.id === activeCardId);

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
          {board.columns.map(column => (
            <Column 
              key={column.id} 
              column={column as any} 
              cards={column.cards as any} 
              onEditCard={(cardId) => openEditModal(cardId, column.id)}
              onAddCard={() => openCreateModal(column.id)}
            />
          ))}
        </SortableContext>
        
        <button className="w-80 shrink-0 h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:text-primary transition-all text-muted-foreground font-medium">
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
          {activeCard ? <Card card={activeCard as any} /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
