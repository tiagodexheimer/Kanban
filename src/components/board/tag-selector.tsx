"use client";

import React, { useState } from "react";
import { Tag, useCreateTag } from "@/hooks/use-kanban";
import { Tag as TagIcon, X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  boardId: string;
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const COLORS = [
  "#7c3aed", // Violet
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
];

export function TagSelector({ boardId, availableTags, selectedTagIds, onChange }: TagSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(COLORS[0]);
  
  const createTag = useCreateTag();

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createTag.mutate({ name: newTagName, color: newTagColor, boardId });
    setNewTagName("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <TagIcon size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-bold text-foreground">Etiquetas</h4>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border",
                isSelected 
                  ? "border-transparent text-white" 
                  : "bg-accent/50 text-muted-foreground border-transparent hover:border-border"
              )}
              style={{ backgroundColor: isSelected ? tag.color : undefined }}
            >
              {tag.name}
              {isSelected && <Check size={12} />}
            </button>
          );
        })}
        
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center w-8 h-6 rounded-full bg-accent/50 text-muted-foreground hover:bg-accent transition-colors border border-dashed border-border"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {isAdding && (
        <div className="p-3 bg-accent/30 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <input
            autoFocus
            type="text"
            placeholder="Nome da etiqueta..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateTag(e as any);
              }
            }}
            className="w-full bg-background border border-border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  newTagColor === color ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreateTag}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Criar Etiqueta
          </button>
        </div>
      )}
    </div>
  );
}
