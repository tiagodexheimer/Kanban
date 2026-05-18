"use client";

import React from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column as ColumnType, Card as CardType, useUpdateColumn, useDeleteColumn } from "@/hooks/use-omnitask";
import { Card } from "./card";
import { Plus, MoreHorizontal, Check, X, GripVertical, Trash2, Palette, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onEditCard: (cardId: string) => void;
  onAddCard: () => void;
}

export function Column({ column, cards, onEditCard, onAddCard }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(column.title);
  const [isColorMenuOpen, setIsColorMenuOpen] = React.useState(false);
  const updateColumnMutation = useUpdateColumn();
  const deleteColumnMutation = useDeleteColumn();

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      updateColumnMutation.mutate({ id: column.id, title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleColorChange = (color: string) => {
    updateColumnMutation.mutate({ id: column.id, color });
  };

  const handleTypeChange = (type: string) => {
    updateColumnMutation.mutate({ id: column.id, type: type as any });
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
              <div 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: column.color || "var(--primary)" }}
              />
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
          <div className="relative">
            <button 
              onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
              className={cn(
                "p-1.5 rounded-md text-muted-foreground transition-colors",
                isColorMenuOpen ? "bg-accent text-primary" : "hover:bg-accent"
              )}
              title="Configurações da lista"
            >
              <Palette size={18} />
            </button>
            {isColorMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsColorMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 bg-popover border border-border rounded-2xl p-4 shadow-2xl z-50 w-56 animate-in fade-in zoom-in duration-200 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Cores</p>
                    <div className="grid grid-cols-4 gap-2">
                      {["#7c3aed", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#f97316", "#64748b"].map(c => (
                        <button 
                          key={c}
                          onClick={() => {
                            handleColorChange(c);
                            setIsColorMenuOpen(false);
                          }}
                          className={cn(
                            "w-7 h-7 rounded-full hover:scale-110 transition-all border-2",
                            column.color === c ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Vínculo de Status</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { type: "TODO", label: "A Fazer (TODO)", color: "#eab308" },
                        { type: "IN_PROGRESS", label: "Em Progresso (Doing)", color: "#3b82f6" },
                        { type: "DONE", label: "Concluído (Done)", color: "#22c55e" }
                      ].map((status) => (
                        <button
                          key={status.type}
                          onClick={() => {
                            handleTypeChange(status.type);
                            handleColorChange(status.color);
                            setIsColorMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                            column.type === status.type 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-accent text-muted-foreground"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Circle size={8} fill={status.color} className="border-none shrink-0" style={{ color: status.color }} />
                            {status.label}
                          </span>
                          {column.type === status.type && <Check size={14} className="text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
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

      <div 
        className="flex-1 bg-accent/20 rounded-2xl p-3 border-t-4 transition-all"
        style={{ borderTopColor: column.color || "var(--primary)" }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={() => onEditCard(card.id)} 
              columnColor={column.color}
            />
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
