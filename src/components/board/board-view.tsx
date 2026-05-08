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
import { arrayMove, sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoardStore } from "@/store/use-board-store";
import { Column } from "./column";
import { Card } from "./card";
import { CardModal } from "./card-modal";
import { createPortal } from "react-dom";

export function BoardView() {
  const { columns, cards, columnOrder, moveCard } = useBoardStore();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ cardId?: string; columnId?: string }>({});

  const openEditModal = (cardId: string, columnId: string) => {
    setModalData({ cardId, columnId });
    setIsModalOpen(true);
  };

  const openCreateModal = (columnId: string) => {
    setModalData({ columnId });
    setIsModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type !== 'Column';
    const isOverACard = over.data.current?.type !== 'Column';

    if (!isActiveACard) return;

    // Movendo card sobre outro card
    if (isActiveACard && isOverACard) {
      const activeColId = Object.keys(columns).find(key => columns[key].cardIds.includes(activeId));
      const overColId = Object.keys(columns).find(key => columns[key].cardIds.includes(overId));

      if (activeColId && overColId && activeColId !== overColId) {
        const overIndex = columns[overColId].cardIds.indexOf(overId);
        moveCard(activeId, activeColId, overColId, overIndex);
      }
    }

    // Movendo card sobre uma coluna vazia
    const isOverAColumn = over.data.current?.type === 'Column';
    if (isActiveACard && isOverAColumn) {
      const activeColId = Object.keys(columns).find(key => columns[key].cardIds.includes(activeId));
      if (activeColId && activeColId !== overId) {
        moveCard(activeId, activeColId, overId, 0);
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

    const activeColId = Object.keys(columns).find(key => columns[key].cardIds.includes(activeId));
    const overColId = Object.keys(columns).find(key => columns[key].cardIds.includes(overId));

    if (activeColId && overColId && activeColId === overColId) {
      const oldIndex = columns[activeColId].cardIds.indexOf(activeId);
      const newIndex = columns[overColId].cardIds.indexOf(overId);
      
      if (oldIndex !== newIndex) {
        moveCard(activeId, activeColId, overColId, newIndex);
      }
    }

    setActiveCardId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full pb-8 overflow-x-auto custom-scrollbar">
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          {columnOrder.map(colId => (
            <Column 
              key={colId} 
              column={columns[colId]} 
              cards={columns[colId].cardIds.map(id => cards[id])} 
              onEditCard={(cardId) => openEditModal(cardId, colId)}
              onAddCard={() => openCreateModal(colId)}
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
        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
          {activeCardId ? (
            <Card card={cards[activeCardId]} />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
