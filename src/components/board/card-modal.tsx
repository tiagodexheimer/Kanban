"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { useBoards, useBoard, useUpdateCard, useCreateCard, useDeleteCard, Card, Tag } from "@/hooks/use-omnitask";
import { ChecklistEditor } from "./checklist-editor";
import { TagSelector } from "./tag-selector";
import { AssigneeSelector } from "./assignee-selector";
import { CommentSection } from "./comment-section";
import { ActivityLog } from "./activity-log";
import { CustomFieldsEditor } from "./custom-fields-editor";
import { Calendar, Users, History } from "lucide-react";
import { useProjects } from "@/hooks/use-omnitask";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId?: string;
  cardId?: string;
  boardId?: string;
}

export function CardModal({ isOpen, onClose, columnId, cardId, boardId: propBoardId }: CardModalProps) {
  const { data: boards } = useBoards();
  const boardId = propBoardId || boards?.[0]?.id;
  const { data: board } = useBoard(boardId!);
  
  const isEditing = !!cardId;
  const currentCard = isEditing ? board?.columns.flatMap(c => c.cards).find(c => c.id === cardId) : null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Detalhes da Tarefa" : "Nova Tarefa"}
    >
      {isOpen && (
        <CardForm 
          card={currentCard} 
          columnId={columnId} 
          onClose={onClose} 
          boardTags={board?.tags || []}
          boardId={boardId}
          projectId={board?.projectId}
          board={board}
        />
      )}
    </Modal>
  );
}

interface CardFormProps {
  card?: Card | null;
  columnId?: string;
  onClose: () => void;
  boardTags: Tag[];
  boardId?: string;
  projectId?: string;
  board?: any;
}

function CardForm({ card, columnId, onClose, boardTags, boardId, projectId, board }: CardFormProps) {
  const updateCardMutation = useUpdateCard();
  const createCardMutation = useCreateCard();
  const deleteCardMutation = useDeleteCard();

  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [priority, setPriority] = useState(card?.priority || "Medium");
  const [dueDate, setDueDate] = useState<string>(
    card?.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ""
  );
  const { data: projects } = useProjects();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    card?.tags.map(t => t.id) || []
  );
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    card?.assignees?.map(a => a.id) || []
  );

  const project = projects?.find(p => p.id === projectId);
  const projectMembers = project?.members || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cardData = {
      title,
      description,
      priority,
      dueDate: dueDate || null,
      tagIds: selectedTagIds,
      assigneeIds: selectedAssigneeIds
    };

    if (card) {
      updateCardMutation.mutate({ id: card.id, ...cardData });
    } else if (columnId) {
      createCardMutation.mutate({ 
        title, 
        columnId, 
        position: 0,
        description,
        priority,
        dueDate: dueDate || null,
        tagIds: selectedTagIds,
        assigneeIds: selectedAssigneeIds
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (card) {
      if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        deleteCardMutation.mutate(card.id);
        onClose();
      }
    }
  };

  return (
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
              onChange={(e) => setPriority(e.target.value as any)}
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
            <div 
              className="relative cursor-pointer group"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input && 'showPicker' in input) {
                  try { (input as HTMLInputElement).showPicker(); } catch (err) { console.error(err); }
                }
              }}
            >
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-accent/30 border border-border/50 rounded-xl p-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-accent/50 transition-colors"
              />
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
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

        {boardId && (
          <TagSelector 
            boardId={boardId}
            availableTags={boardTags}
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        )}

        {card && board?.customFields && (
          <CustomFieldsEditor 
            cardId={card.id}
            fields={board.customFields}
            values={card.customFieldValues || []}
          />
        )}

        <AssigneeSelector 
          availableUsers={projectMembers}
          selectedUserIds={selectedAssigneeIds}
          onChange={setSelectedAssigneeIds}
        />

        {card && (
          <div className="pt-4 border-t border-border/50">
            <CommentSection cardId={card.id} />
          </div>
        )}

        {card && (
          <div className="pt-4 border-t border-border/50">
            <ActivityLog cardId={card.id} title="Histórico da Tarefa" />
          </div>
        )}

        {card && (
          <div className="pt-2 border-t border-border/50">
            <ChecklistEditor 
              cardId={card.id} 
              items={card.checklists} 
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 gap-3 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-2">
        {card && (
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
            {card ? "Salvar Alterações" : "Criar Tarefa"}
          </button>
        </div>
      </div>
    </form>
  );
}
