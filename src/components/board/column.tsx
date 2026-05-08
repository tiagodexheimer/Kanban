"use client";

import React from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column as ColumnType, Card as CardType } from "@/hooks/use-kanban";
import { Card } from "./card";
import { Plus, MoreHorizontal } from "lucide-react";

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onEditCard: (cardId: string) => void;
  onAddCard: () => void;
}

export function Column({ column, cards, onEditCard, onAddCard }: ColumnProps) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: column.id,
    data: { type: 'Column' }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const cardIds = cards.map(c => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-80 shrink-0 min-h-[500px]"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground">{column.title}</h3>
          <span className="bg-accent text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors">
            <Plus size={18} />
          </button>
          <button className="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-accent/20 rounded-2xl p-3 border border-transparent hover:border-border transition-colors">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card key={card.id} card={card} onClick={() => onEditCard(card.id)} />
          ))}
        </SortableContext>
        
        <button 
          onClick={onAddCard}
          className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all border border-dashed border-transparent hover:border-border"
        >
          <Plus size={16} />
          Adicionar Tarefa
        </button>
      </div>
    </div>
  );
}
