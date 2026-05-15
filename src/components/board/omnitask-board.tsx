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
import { Column as ColumnType, Card as CardType } from "@/hooks/use-omnitask";
import { Column } from "./column";
import { Card } from "./card";
import { createPortal } from "react-dom";

interface OmnitaskBoardProps {
  columns: ColumnType[];
  boardId: string;
  onEditCard: (cardId: string, columnId: string) => void;
  onAddCard: (columnId: string) => void;
  onAddColumn: () => void;
  onUpdateCard: (data: any) => void;
  onUpdateColumn: (data: any) => void;
}

export function OmnitaskBoard({ 
  columns: initialColumns, 
  boardId, 
  onEditCard, 
  onAddCard, 
  onAddColumn,
  onUpdateCard,
  onUpdateColumn
}: OmnitaskBoardProps) {
  const [localColumns, setLocalColumns] = React.useState(initialColumns);
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(null);

  // Sync with props when they change externally
  React.useEffect(() => {
    if (!activeCardId && !activeColumnId) {
      setLocalColumns(initialColumns);
    }
  }, [initialColumns, activeCardId, activeColumnId]);
  
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

    // Find the cards and columns locally
    const activeCard = localColumns.flatMap(c => c.cards).find(c => c.id === activeId);
    if (!activeCard) return;

    const overCard = localColumns.flatMap(c => c.cards).find(c => c.id === overId);
    const overColumn = localColumns.find(c => c.id === overId);

    if (!overCard && !overColumn) return;

    const overColumnId = overCard ? overCard.columnId : overId;

    if (activeCard.columnId === overColumnId) {
      setLocalColumns(prev => {
        const col = prev.find(c => c.id === overColumnId);
        if (!col) return prev;

        const oldIndex = col.cards.findIndex(c => c.id === activeId);
        const newIndex = col.cards.findIndex(c => c.id === overId);

        if (oldIndex === newIndex) return prev;

        return prev.map(c => {
          if (c.id === overColumnId) {
            const newCards = arrayMove(col.cards, oldIndex, newIndex);
            // Update position property locally for all cards in this column
            return { 
              ...c, 
              cards: newCards.map((card, index) => ({ ...card, position: index }))
            };
          }
          return c;
        });
      });
    } else {
      setLocalColumns(prev => {
        const activeCol = prev.find(c => c.id === activeCard.columnId);
        const overCol = prev.find(c => c.id === overColumnId);

        if (!activeCol || !overCol) return prev;

        const activeCards = activeCol.cards.filter(c => c.id !== activeId);
        const overCards = [...overCol.cards];
        
        const newCard = { ...activeCard, columnId: overColumnId };
        
        // Find insert position
        const overIndex = overCard 
          ? overCards.findIndex(c => c.id === overId) 
          : overCards.length;
        
        overCards.splice(overIndex, 0, newCard);

        return prev.map(c => {
          if (c.id === activeCard.columnId) {
            return { 
              ...c, 
              cards: activeCards.map((card, index) => ({ ...card, position: index }))
            };
          }
          if (c.id === overColumnId) {
            return { 
              ...c, 
              cards: overCards.map((card, index) => ({ ...card, position: index }))
            };
          }
          return c;
        });
      });
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
        
        setLocalColumns(newOrder);

        newOrder.forEach((col, index) => {
          onUpdateColumn({ id: col.id, position: index });
        });
      }
    } else {
      const activeCard = localColumns.flatMap(c => c.cards).find(c => c.id === activeId);
      const overCard = localColumns.flatMap(c => c.cards).find(c => c.id === overId);

      if (activeCard) {
        const activeColumn = localColumns.find(c => c.id === activeCard.columnId);
        if (activeColumn) {
          // Update all cards in the column to ensure consistent positions
          activeColumn.cards.forEach((card, index) => {
            onUpdateCard({ 
              id: card.id, 
              columnId: card.columnId, 
              position: index 
            });
          });
        }
      }
    }

    setActiveCardId(null);
    setActiveColumnId(null);
  }

  const columnIds = localColumns.map(c => c.id);
  const activeCard = localColumns.flatMap(c => c.cards).find(c => c.id === activeCardId);
  const activeColumn = localColumns.find(c => c.id === activeColumnId);

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
          {localColumns.map(column => (
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
