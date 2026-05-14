"use client";

import React, { useState } from "react";
import { ChecklistItem, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from "@/hooks/use-omnitask";
import { CheckSquare, Square, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistEditorProps {
  cardId?: string;
  items: any[];
  onChange?: (items: any[]) => void;
}

export function ChecklistEditor({ cardId, items, onChange }: ChecklistEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    if (cardId) {
      createItem.mutate({ text: newItemText, cardId, position: items.length });
    } else if (onChange) {
      onChange([...items, { text: newItemText, completed: false, position: items.length, id: Math.random().toString() }]);
    }
    setNewItemText("");
  };

  const handleToggleItem = (item: any) => {
    if (cardId) {
      updateItem.mutate({ id: item.id, completed: !item.completed });
    } else if (onChange) {
      onChange(items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    }
  };

  const handleUpdateText = (item: any, text: string) => {
    if (cardId) {
      updateItem.mutate({ id: item.id, text });
    } else if (onChange) {
      onChange(items.map(i => i.id === item.id ? { ...i, text } : i));
    }
  };

  const handleDeleteItem = (id: string) => {
    if (cardId) {
      deleteItem.mutate(id);
    } else if (onChange) {
      onChange(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <h4 className="text-sm font-bold text-foreground">Checklist</h4>
          <span className="text-xs text-muted-foreground ml-1">
            {completedCount}/{items.length}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Barra de Progresso */}
          <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Lista de Itens */}
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 group">
                <button
                  type="button"
                  onClick={() => handleToggleItem(item)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.completed ? (
                    <CheckSquare size={18} className="text-primary" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleUpdateText(item, e.target.value)}
                  className={cn(
                    "flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 outline-none transition-all",
                    item.completed && "line-through text-muted-foreground"
                  )}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Novo Item */}
          <div className="flex items-center gap-2 pl-7">
            <input
              type="text"
              placeholder="Adicionar item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem(e as any);
                }
              }}
              className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 outline-none italic text-muted-foreground hover:text-foreground transition-colors"
            />
            {newItemText && (
              <button 
                type="button"
                onClick={handleAddItem}
                className="p-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
