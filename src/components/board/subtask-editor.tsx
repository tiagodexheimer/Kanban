"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Card, useCreateSubtask, useUpdateCard, useDeleteCard } from "@/hooks/use-omnitask";
import { cn } from "@/lib/utils";

interface SubtaskEditorProps {
  parentId: string;
  columnId: string;
  subtasks: Card[];
}

export function SubtaskEditor({ parentId, columnId, subtasks }: SubtaskEditorProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const createSubtaskMutation = useCreateSubtask();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    createSubtaskMutation.mutate({
      title: newSubtaskTitle,
      parentId,
      columnId,
      position: subtasks.length + 1
    });
    setNewSubtaskTitle("");
  };

  const toggleComplete = (subtask: Card) => {
    const isDone = subtask.priority === "Low" && subtask.title.startsWith("✓ ");
    
    updateCardMutation.mutate({
      id: subtask.id,
      title: isDone ? subtask.title.replace("✓ ", "") : "✓ " + subtask.title,
      priority: isDone ? "Medium" : "Low"
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div 
            key={subtask.id} 
            className="group flex items-center gap-3 p-2.5 rounded-xl bg-accent/20 border border-border/40 hover:bg-accent/40 transition-all animate-in slide-in-from-left-2 duration-200"
          >
            <button 
              onClick={() => toggleComplete(subtask)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {subtask.title.startsWith("✓ ") ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <Circle size={18} />
              )}
            </button>
            
            <span className={cn(
              "flex-1 text-sm font-medium transition-all",
              subtask.title.startsWith("✓ ") ? "line-through text-muted-foreground opacity-60" : "text-foreground"
            )}>
              {subtask.title.replace("✓ ", "")}
            </span>

            <button
              onClick={() => deleteCardMutation.mutate(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddSubtask} className="flex gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Adicionar subtarefa..."
          className="flex-1 bg-accent/10 border border-border/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <button
          type="submit"
          disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}
          className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}
