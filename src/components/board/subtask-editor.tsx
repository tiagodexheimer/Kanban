"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Card, useCreateSubtask, useUpdateCard, useDeleteCard } from "@/hooks/use-omnitask";
import { cn } from "@/lib/utils";

interface SubtaskEditorProps {
  parentId: string;
  columnId: string; // This is the parent's columnId
  subtasks: Card[];
  board?: any;
}

export function SubtaskEditor({ parentId, columnId, subtasks, board }: SubtaskEditorProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const createSubtaskMutation = useCreateSubtask();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    createSubtaskMutation.mutate({
      title: newSubtaskTitle,
      parentId,
      columnId,
      position: subtasks.length + 1
    });
    setNewSubtaskTitle("");
  };

  const toggleComplete = (e: React.MouseEvent, subtask: Card) => {
    e.stopPropagation();
    
    // Find the DONE column or similar
    const doneColumn = board?.columns.find((c: any) => 
      c.type === "DONE" || 
      c.title.toLowerCase().includes("done") || 
      c.title.toLowerCase().includes("conclu")
    );

    const isCurrentlyDone = doneColumn && subtask.columnId === doneColumn.id;
    
    updateCardMutation.mutate({
      id: subtask.id,
      columnId: isCurrentlyDone ? columnId : (doneColumn?.id || columnId),
      priority: isCurrentlyDone ? "Medium" : "Low"
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedSubtaskId(expandedSubtaskId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {subtasks.map((subtask) => {
          const doneColumn = board?.columns.find((c: any) => 
            c.type === "DONE" || 
            c.title.toLowerCase().includes("done") || 
            c.title.toLowerCase().includes("conclu")
          );
          const isDone = doneColumn && subtask.columnId === doneColumn.id;
          const isExpanded = expandedSubtaskId === subtask.id;

          return (
            <div 
              key={subtask.id} 
              className={cn(
                "group flex flex-col p-2 rounded-xl border transition-all duration-200",
                isDone ? "bg-accent/10 border-border/20 opacity-70" : "bg-card border-border/40 hover:border-primary/40 shadow-sm",
                isExpanded && "ring-1 ring-primary/20 bg-accent/20"
              )}
            >
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={(e) => toggleComplete(e, subtask)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-green-500 animate-in zoom-in duration-300" />
                  ) : (
                    <Circle size={18} className="group-hover:scale-110 transition-transform" />
                  )}
                </button>
                
                <span 
                  onClick={() => toggleExpand(subtask.id)}
                  className={cn(
                    "flex-1 text-sm font-medium cursor-pointer transition-all hover:text-primary",
                    isDone ? "line-through text-muted-foreground" : "text-foreground"
                  )}
                >
                  {subtask.title}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => deleteCardMutation.mutate(subtask.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-all rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2 px-8 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="text-xs text-muted-foreground bg-accent/30 p-2.5 rounded-lg border border-border/50">
                    {subtask.description ? (
                      <p className="whitespace-pre-wrap">{subtask.description}</p>
                    ) : (
                      <p className="italic opacity-50">Sem descrição adicional.</p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Subtarefa
                    </span>
                    {subtask.dueDate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Prazo: {new Date(subtask.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSubtask();
            }
          }}
          placeholder="Adicionar nova subtarefa..."
          className="flex-1 bg-accent/10 border border-border/30 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
        />
        <button
          type="button"
          onClick={handleAddSubtask}
          disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}
          className="px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 font-bold text-xs"
        >
          {createSubtaskMutation.isPending ? "..." : "ADD"}
        </button>
      </div>
    </div>
  );
}
