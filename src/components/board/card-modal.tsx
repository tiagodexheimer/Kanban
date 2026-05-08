"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { useBoardStore, Priority } from "@/store/use-board-store";
import { cn } from "@/lib/utils";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId?: string;
  cardId?: string;
}

export function CardModal({ isOpen, onClose, columnId, cardId }: CardModalProps) {
  const { cards, addCard, updateCard, deleteCard } = useBoardStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  const isEditing = !!cardId;

  useEffect(() => {
    if (isEditing && cardId && cards[cardId]) {
      const card = cards[cardId];
      setTitle(card.title);
      setDescription(card.description || "");
      setPriority(card.priority);
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
    }
  }, [isOpen, cardId, cards, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && cardId) {
      updateCard(cardId, { title, description, priority });
    } else if (columnId) {
      addCard(columnId, title);
      // Aqui poderíamos atualizar os outros campos após criar o card básico
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && cardId && columnId) {
      if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        deleteCard(cardId, columnId);
        onClose();
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Editar Tarefa" : "Nova Tarefa"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Título</label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="w-full bg-accent/50 border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Adicione mais detalhes..."
            rows={3}
            className="w-full bg-accent/50 border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Prioridade</label>
          <div className="flex gap-2">
            {(["Low", "Medium", "High", "Urgent"] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-xs font-bold transition-all border",
                  priority === p 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-accent/50 text-muted-foreground border-transparent hover:border-border"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              Excluir
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              {isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
