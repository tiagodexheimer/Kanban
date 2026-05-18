"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { useBoards, useBoard, useCard, useUpdateCard, useCreateCard, useDeleteCard, Card, Tag, useProjects, useCustomFields } from "@/hooks/use-omnitask";
import { useCreateBacklogTask } from "@/hooks/use-backlog";
import { ChecklistEditor } from "./checklist-editor";
import { TagSelector } from "./tag-selector";
import { AssigneeSelector } from "./assignee-selector";
import { CommentSection } from "./comment-section";
import { ActivityLog } from "./activity-log";
import { CustomFieldsEditor } from "./custom-fields-editor";
import { Calendar, Users, History, Link as LinkIcon, Layers, Clock } from "lucide-react";
import { SubtaskEditor } from "./subtask-editor";
import { DependencyEditor } from "./dependency-editor";
import { cn } from "@/lib/utils";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId?: string;
  cardId?: string;
  boardId?: string;
  backlogId?: string;
  projectId?: string;
}

export function CardModal({ isOpen, onClose, columnId, cardId, boardId: propBoardId, backlogId, projectId: propProjectId }: CardModalProps) {
  const { data: boards } = useBoards();
  const boardId = propBoardId || boards?.[0]?.id;
  const { data: board } = useBoard(boardId!);
  
  const isEditing = !!cardId;
  const { data: fullCard, isLoading: isLoadingCard } = useCard(cardId!);

  const projectId = propProjectId || board?.projectId;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Detalhes da Tarefa" : "Nova Tarefa"}
      size="xl"
    >
      {isOpen && (
        isLoadingCard ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando detalhes...</div>
        ) : (
          <CardForm 
            card={fullCard} 
            columnId={columnId} 
            backlogId={backlogId}
            onClose={onClose} 
            boardTags={board?.tags || []}
            boardId={boardId}
            projectId={projectId}
            board={board}
          />
        )
      )}
    </Modal>
  );
}

interface CardFormProps {
  card?: Card | null;
  columnId?: string;
  backlogId?: string;
  onClose: () => void;
  boardTags: Tag[];
  boardId?: string;
  projectId?: string;
  board?: any;
}

function CardForm({ card, columnId, backlogId, onClose, boardTags, boardId, projectId, board }: CardFormProps) {
  const updateCardMutation = useUpdateCard();
  const createCardMutation = useCreateCard();
  const createBacklogTaskMutation = useCreateBacklogTask(projectId || "");
  const deleteCardMutation = useDeleteCard();
  const { data: projectFields } = useCustomFields(projectId || "");

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
  const [parentId, setParentId] = useState<string | undefined>(card?.parentId);
  const [blockedByIds, setBlockedByIds] = useState<string[]>(card?.blockedBy?.map(d => d.id) || []);
  const [blockingIds, setBlockingIds] = useState<string[]>(card?.blocking?.map(d => d.id) || []);
  const [relatedToIds, setRelatedToIds] = useState<string[]>(card?.relatedTo?.map(d => d.id) || []);
  const [checklists, setChecklists] = useState<any[]>(card?.checklists || []);
  const [customFieldValues, setCustomFieldValues] = useState<any[]>(card?.customFieldValues || []);
  
  const [activeTab, setActiveTab] = useState<"geral" | "historico">("geral");

  const handleCustomFieldChange = (customFieldId: string, value: string) => {
    setCustomFieldValues((prev) => {
      const existingIndex = prev.findIndex((v) => v.customFieldId === customFieldId);
      if (existingIndex > -1) {
        return prev.map((v, i) => (i === existingIndex ? { ...v, value } : v));
      }
      return [...prev, { customFieldId, value }];
    });
  };

  const project = projects?.find(p => p.id === projectId);
  
  // Combine owner and members into a single list of users
  const projectMembers = React.useMemo(() => {
    if (!project) return [];
    
    const members = project.members.map(m => m.user);
    const owner = project.owner;
    
    // Check if owner is already in members
    const isOwnerInMembers = members.some(m => m.id === owner.id);
    
    if (!isOwnerInMembers && owner) {
      // Add owner to members list (ensure they have email if needed, though id/name/image is usually enough for display)
      return [owner, ...members];
    }
    
    return members;
  }, [project]);

  const allCards = board?.columns.flatMap((c: any) => c.cards) || [];
  const availableParentCards = allCards.filter((c: any) => c.id !== card?.id && !c.parentId);

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
      updateCardMutation.mutate({ 
        id: card.id, 
        ...cardData,
        parentId,
        blockedByIds,
        blockingIds,
        relatedToIds
      });
    } else if (backlogId) {
      createBacklogTaskMutation.mutate({ 
        title, 
        backlogId, 
        description,
        priority,
        dueDate: dueDate || null,
        tagIds: selectedTagIds,
        assigneeIds: selectedAssigneeIds,
        parentId,
        blockedByIds,
        blockingIds,
        relatedToIds,
        checklists: checklists.map(c => ({ text: c.text, completed: c.completed, position: c.position })),
        customFieldValues: customFieldValues.map(v => ({ customFieldId: v.customFieldId, value: v.value }))
      });
    } else if (columnId) {
      createCardMutation.mutate({ 
        title, 
        columnId, 
        position: 0,
        description,
        priority,
        dueDate: dueDate || null,
        tagIds: selectedTagIds,
        assigneeIds: selectedAssigneeIds,
        parentId,
        blockedByIds,
        blockingIds,
        relatedToIds,
        checklists: checklists.map(c => ({ text: c.text, completed: c.completed, position: c.position })),
        customFieldValues: customFieldValues.map(v => ({ customFieldId: v.customFieldId, value: v.value }))
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
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Tabs Header */}
      <div className="flex items-center gap-6 border-b border-border mb-4">
        <button 
          onClick={() => setActiveTab("geral")}
          className={cn(
            "pb-3 text-sm font-bold transition-all border-b-2",
            activeTab === "geral" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Geral
        </button>
        {card && (
          <button 
            onClick={() => setActiveTab("historico")}
            className={cn(
              "pb-3 text-sm font-bold transition-all border-b-2",
              activeTab === "historico" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Histórico
          </button>
        )}
      </div>

      <form id="card-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1 custom-scrollbar">
        {activeTab === "geral" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Main Content */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Título</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="O que precisa ser feito?"
                  className="w-full bg-accent/30 border border-border/50 rounded-xl p-3 text-lg text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione mais detalhes..."
                  rows={4}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Subtarefas Aninhadas</h3>
                </div>
                {card ? (
                  <SubtaskEditor 
                    parentId={card.id} 
                    columnId={card.columnId}
                    subtasks={card.subtasks || []} 
                    board={board}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground italic ml-6">Salve a tarefa para poder adicionar subtarefas.</p>
                )}
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Dependências e Relações</h3>
                </div>
                <DependencyEditor 
                  card={card || {}}
                  board={board}
                  blockedByIds={blockedByIds}
                  blockingIds={blockingIds}
                  relatedToIds={relatedToIds}
                  onBlockedByChange={setBlockedByIds}
                  onBlockingChange={setBlockingIds}
                  onRelatedToChange={setRelatedToIds}
                />
              </div>

              {card && (
                <div className="pt-6 border-t border-border/50">
                  <CommentSection cardId={card.id} board={board} />
                </div>
              )}
            </div>

            {/* Right Column: Properties */}
            <div className="lg:col-span-4 space-y-6 bg-accent/10 p-4 rounded-2xl border border-border/30 h-fit">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prioridade</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-card border border-border/50 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary font-bold"
                  >
                    <option value="Low">Baixa</option>
                    <option value="Medium">Média</option>
                    <option value="High">Alta</option>
                    <option value="Urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prazo</label>
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
                      className="w-full bg-card border border-border/50 rounded-xl p-2.5 pl-9 text-xs outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-accent/50 transition-colors font-bold"
                    />
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {card && (
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Criada em</label>
                    <div className="bg-card/30 border border-border/30 rounded-xl p-2.5 text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                      <Clock size={12} />
                      {new Date(card.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1 flex items-center gap-2">
                  <Layers size={14} className="text-primary" />
                  Tarefa Pai
                </label>
                <select
                  value={parentId || ""}
                  onChange={(e) => setParentId(e.target.value || undefined)}
                  className="w-full bg-card border border-border/50 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                >
                  <option value="">Nenhuma</option>
                  {availableParentCards.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <AssigneeSelector 
                availableUsers={projectMembers}
                selectedUserIds={selectedAssigneeIds}
                onChange={setSelectedAssigneeIds}
              />

              {boardId && (
                <TagSelector 
                  boardId={boardId}
                  availableTags={boardTags}
                  selectedTagIds={selectedTagIds}
                  onChange={setSelectedTagIds}
                />
              )}

              {projectFields && projectFields.length > 0 && (
                <CustomFieldsEditor 
                  cardId={card?.id}
                  fields={projectFields}
                  values={customFieldValues}
                  onChange={handleCustomFieldChange}
                />
              )}

              <div className="pt-2">
                <ChecklistEditor 
                  cardId={card?.id} 
                  items={checklists} 
                  onChange={setChecklists}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto max-h-[70vh]">
            <ActivityLog cardId={card!.id} title="Histórico da Tarefa" />
          </div>
        )}
      </form>

      {/* Footer - Outside scroll area */}
      <div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-3 bg-card sticky bottom-0">
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
            form="card-form"
            type="submit"
            className="px-8 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            {card ? "Salvar Alterações" : "Criar Tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
}
