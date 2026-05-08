import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { useBoards, useBoard, useUpdateCard, useCreateCard, useDeleteCard } from "@/hooks/use-kanban";
import { ChecklistEditor } from "./checklist-editor";
import { TagSelector } from "./tag-selector";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId?: string;
  cardId?: string;
}

export function CardModal({ isOpen, onClose, columnId, cardId }: CardModalProps) {
  const { data: boards } = useBoards();
  const boardId = boards?.[0]?.id;
  const { data: board } = useBoard(boardId!);
  
  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const isEditing = !!cardId;
  const currentCard = isEditing ? board?.columns.flatMap(c => c.cards).find(c => c.id === cardId) : null;

  useEffect(() => {
    if (isEditing && currentCard) {
      setTitle(currentCard.title);
      setDescription(currentCard.description || "");
      setPriority(currentCard.priority);
      setDueDate(currentCard.dueDate ? new Date(currentCard.dueDate).toISOString().split('T')[0] : "");
      setSelectedTagIds(currentCard.tags.map(t => t.id));
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      setSelectedTagIds([]);
    }
  }, [isOpen, cardId, board, isEditing, currentCard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cardData = {
      title,
      description,
      priority,
      dueDate: dueDate || null,
      tagIds: selectedTagIds
    };

    if (isEditing && cardId) {
      updateCardMutation.mutate({ id: cardId, ...cardData });
    } else if (columnId) {
      createCardMutation.mutate({ title, columnId, position: 0 });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && cardId) {
      if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        deleteCardMutation.mutate(cardId);
        onClose();
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Detalhes da Tarefa" : "Nova Tarefa"}
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Título</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full bg-accent/30 border border-border/50 rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prioridade</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-accent/30 border border-border/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Low">Baixa</option>
                <option value="Medium">Média</option>
                <option value="High">Alta</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prazo</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl p-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione mais detalhes..."
              rows={3}
              className="w-full bg-accent/30 border border-border/50 rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
            />
          </div>

          {board && (
            <TagSelector 
              boardId={board.id}
              availableTags={board.tags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          )}

          {isEditing && cardId && currentCard && (
            <div className="pt-2 border-t border-border/50">
              <ChecklistEditor 
                cardId={cardId} 
                items={currentCard.checklists} 
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 gap-3 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-2">
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
              {isEditing ? "Salvar Alterações" : "Criar Tarefa"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
