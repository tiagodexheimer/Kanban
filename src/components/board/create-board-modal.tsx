"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { useCreateBoard } from "@/hooks/use-omnitask";
import { useRouter } from "next/navigation";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  folderId?: string;
}

export function CreateBoardModal({ isOpen, onClose, projectId, folderId }: CreateBoardModalProps) {
  const router = useRouter();
  const createBoardMutation = useCreateBoard();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Reset inputs when modal is closed or opened
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createBoardMutation.mutate({
      title,
      description,
      projectId,
      folderId
    }, {
      onSuccess: (data) => {
        onClose();
        router.push(`/boards/${data.id}`);
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Quadro" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome do Quadro</label>
            <input 
              type="text" 
              placeholder="Ex: Desenvolvimento, Planejamento Semanal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Descrição</label>
            <textarea 
              placeholder="Descreva brevemente o propósito deste quadro..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createBoardMutation.isPending || !title.trim()}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {createBoardMutation.isPending ? "Criando..." : "Criar Quadro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
