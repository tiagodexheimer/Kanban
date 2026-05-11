"use client";

import React from "react";
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
  SortableContext, 
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { Column as ColumnType, Card as CardType } from "@/hooks/use-kanban";
import { Column } from "./column";
import { Card } from "./card";
import { createPortal } from "react-dom";

interface KanbanBoardProps {
  columns: ColumnType[];
  boardId: string;
  onEditCard: (cardId: string, columnId: string) => void;
  onAddCard: (columnId: string) => void;
  onAddColumn: () => void;
  onUpdateCard: (data: any) => void;
  onUpdateColumn: (data: any) => void;
}

export function KanbanBoard({ 
  columns, 
  boardId, 
  onEditCard, 
  onAddCard, 
  onAddColumn,
  onUpdateCard,
  onUpdateColumn
}: KanbanBoardProps) {
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

    if (activeType === 'Column' && overType === 'Column') return;

    if (activeType === 'Column') return;

    const activeCard = columns.flatMap(c => c.cards).find(c => c.id === activeId);
    if (!activeCard) return;

    const isOverACard = !!columns.flatMap(c => c.cards).find(c => c.id === overId);
    const isOverAColumn = !!columns.find(c => c.id === overId);

    if (isOverACard) {
      const overCard = columns.flatMap(c => c.cards).find(c => c.id === overId);
      if (overCard && activeCard.columnId !== overCard.columnId) {
        onUpdateCard({ id: activeId, columnId: overCard.columnId, position: overCard.position });
      }
    } else if (isOverAColumn) {
      if (activeCard.columnId !== overId) {
        onUpdateCard({ id: activeId, columnId: overId, position: 0 });
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
        const oldIndex = columns.findIndex((i) => i.id === activeId);
        const newIndex = columns.findIndex((i) => i.id === overId);
        const newOrder = arrayMove(columns, oldIndex, newIndex);
        
        newOrder.forEach((col, index) => {
          if (col.position !== index) {
            onUpdateColumn({ id: col.id, position: index });
          }
        });
      }
    } else {
      const activeCard = columns.flatMap(c => c.cards).find(c => c.id === activeId);
      const overCard = columns.flatMap(c => c.cards).find(c => c.id === overId);

      if (activeCard && overCard && activeCard.columnId === overCard.columnId) {
        if (activeId !== overId) {
          onUpdateCard({ id: activeId, position: overCard.position });
        }
      }
    }

    setActiveCardId(null);
    setActiveColumnId(null);
  }

  const columnIds = columns.map(c => c.id);
  const activeCard = columns.flatMap(c => c.cards).find(c => c.id === activeCardId);
  const activeColumn = columns.find(c => c.id === activeColumnId);

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
          {columns.map(column => (
            <Column 
              key={column.id} 
              column={column} 
              cards={column.cards} 
              onEditCard={(cardId) => onEditCard(cardId, column.id)}
              onAddCard={() => onAddCard(column.id)}
            />
          ))}
        </SortableContext>
        
        <button 
          onClick={onAddColumn}
          className="w-80 shrink-0 h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:text-primary transition-all text-muted-foreground font-medium bg-secondary/20 hover:bg-secondary/40"
        >
          + Adicionar Lista
        </button>
      </div>

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
