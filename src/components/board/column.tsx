"use client";

import React from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column as ColumnType, Card as CardType, useUpdateColumn, useDeleteColumn } from "@/hooks/use-kanban";
import { Card } from "./card";
import { Plus, MoreHorizontal, Check, X, GripVertical, Trash2 } from "lucide-react";

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onEditCard: (cardId: string) => void;
  onAddCard: () => void;
}

export function Column({ column, cards, onEditCard, onAddCard }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(column.title);
  const updateColumnMutation = useUpdateColumn();
  const deleteColumnMutation = useDeleteColumn();

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      updateColumnMutation.mutate({ id: column.id, title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleDeleteColumn = () => {
    if (confirm(`Deseja excluir a lista "${column.title}" e todas as suas tarefas?`)) {
      deleteColumnMutation.mutate(column.id);
    }
  };

  const {
    attributes,
    listeners,
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
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = cards.map(c => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-80 shrink-0 min-h-[500px]"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 flex-1 mr-2 overflow-hidden">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded text-muted-foreground shrink-0"
          >
            <GripVertical size={16} />
          </div>
          
          {isEditingTitle ? (
            <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setEditedTitle(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="bg-accent/50 border border-primary rounded px-2 py-0.5 text-sm font-bold w-full outline-none"
              />
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer group/title overflow-hidden"
              onClick={() => setIsEditingTitle(true)}
            >
              <h3 className="font-bold text-foreground group-hover/title:text-primary transition-colors truncate">
                {column.title}
              </h3>
              <span className="bg-accent text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                {cards.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleDeleteColumn}
            className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
            title="Excluir lista"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={onAddCard}
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-primary transition-colors"
            title="Adicionar tarefa"
          >
            <Plus size={18} />
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
