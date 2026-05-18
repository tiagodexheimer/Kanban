"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProjectStats } from "@/hooks/use-omnitask";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  Briefcase, Inbox, Settings, ListTodo, Plus, X, Trash2, ChevronRight, LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useBacklogs, 
  useCreateBacklogTask, 
  useDeleteBacklogTask, 
  usePromoteBacklogTask 
} from "@/hooks/use-backlog";
import { ProjectSettingsModal } from "@/components/project/project-settings-modal";
import { CardModal } from "@/components/board/card-modal";

export default function ProjectBacklogPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const searchParams = useSearchParams();

  const backlogIdParam = searchParams.get("backlogId");

  const { data, isLoading, error } = useProjectStats(projectId);
  const { data: backlogs, isLoading: isLoadingBacklogs } = useBacklogs(projectId);

  const createBacklogTaskMutation = useCreateBacklogTask(projectId);
  const deleteBacklogTaskMutation = useDeleteBacklogTask(projectId);
  const promoteBacklogTaskMutation = usePromoteBacklogTask(projectId);

  const [selectedBacklogId, setSelectedBacklogId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"geral" | "membros" | "backlogs">("backlogs");
  const [activeAddTaskBacklogId, setActiveAddTaskBacklogId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Média");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Sync active backlog ID from query params
  useEffect(() => {
    if (backlogIdParam) {
      setSelectedBacklogId(backlogIdParam);
    } else if (backlogs && backlogs.length > 0 && !selectedBacklogId) {
      setSelectedBacklogId(backlogs[0].id);
    }
  }, [backlogIdParam, backlogs]);

  const PRIORITY_BADGES: Record<string, string> = {
    "Baixa": "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    "Média": "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    "Alta": "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    "Urgente": "bg-rose-500/10 text-rose-500 border border-rose-500/20",
  };

  if (isLoading || isLoadingBacklogs) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando backlog do projeto...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6 px-4 text-center">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full">
          <Briefcase size={40} />
        </div>
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <p className="text-muted-foreground max-w-md">O projeto que você está procurando não existe ou você não possui permissão de acesso.</p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-bold"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const { project, boards } = data;

  // Determine currently active backlog
  const activeBacklog = backlogs?.find(b => b.id === (selectedBacklogId || backlogIdParam)) || backlogs?.[0];

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Inbox size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.title}</h1>
              <p className="text-muted-foreground mt-1 max-w-xl">Backlog do Projeto — Espaço dedicado ao planejamento de novas tarefas, ideias e pendências futuras.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSettingsTab("geral");
              setIsSettingsOpen(true);
            }}
            className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 shadow-2xs self-start md:self-auto"
          >
            <Settings size={16} />
            Configurações
          </button>
        </header>

        {/* SINGLE FOCUSED BACKLOG CONTENT */}
        <div className="w-full space-y-6 animate-fadeIn">
          {/* Backlog Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Inbox size={22} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Backlog Selecionado</span>
                {backlogs && backlogs.length > 0 ? (
                  <select
                    value={activeBacklog?.id || ""}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedBacklogId(newId);
                      router.push(`/projects/${projectId}/backlog?backlogId=${newId}`);
                    }}
                    className="bg-transparent font-black text-base text-foreground outline-none border-none cursor-pointer pr-8 block -mt-1 focus:ring-0"
                  >
                    {backlogs.map(b => (
                      <option key={b.id} value={b.id} className="bg-card font-semibold text-sm">{b.title}</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-black text-base text-muted-foreground">Nenhum backlog criado</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setSettingsTab("backlogs");
                  setIsSettingsOpen(true);
                }}
                className="px-3.5 py-2 border border-border rounded-xl text-xs font-bold hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Settings size={13} />
                Gerenciar Backlogs
              </button>
            </div>
          </div>

          {activeBacklog && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
              {/* Backlog Details & Quick Add */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                  <h4 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Inbox size={18} className="text-primary/70 shrink-0" />
                    {activeBacklog.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeBacklog.tasks?.length || 0} tarefas cadastradas nesta lista de backlog.</p>
                </div>

                <button
                  onClick={() => {
                    if (activeAddTaskBacklogId === activeBacklog.id) {
                      setActiveAddTaskBacklogId(null);
                    } else {
                      setActiveAddTaskBacklogId(activeBacklog.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1 self-start sm:self-auto"
                >
                  {activeAddTaskBacklogId === activeBacklog.id ? (
                    <>
                      <X size={13} />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      Nova Tarefa
                    </>
                  )}
                </button>
              </div>

              {/* Add Task Expandable Form */}
              {activeAddTaskBacklogId === activeBacklog.id && (
                <div className="p-5 bg-accent/10 border border-border rounded-2xl animate-in slide-in-from-top-2 duration-200 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border/20">
                    <h5 className="text-xs font-black uppercase text-primary tracking-wider">Nova Tarefa no Backlog</h5>
                    <button 
                      onClick={() => setActiveAddTaskBacklogId(null)}
                      className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Título</label>
                      <input 
                        type="text"
                        placeholder="Título da tarefa..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Descrição</label>
                      <textarea
                        placeholder="Descreva o que deve ser feito (opcional)..."
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:border-primary transition-all font-medium resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Prioridade</label>
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                        >
                          <option value="Baixa">Baixa</option>
                          <option value="Média">Média</option>
                          <option value="Alta">Alta</option>
                          <option value="Urgente">Urgente</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setActiveAddTaskBacklogId(null);
                            setNewTaskTitle("");
                            setNewTaskDescription("");
                            setNewTaskPriority("Média");
                          }}
                          className="px-3.5 py-2 hover:bg-accent text-muted-foreground hover:text-foreground font-bold rounded-xl text-xs transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (!newTaskTitle.trim()) return;
                            createBacklogTaskMutation.mutate({
                              backlogId: activeBacklog.id,
                              title: newTaskTitle.trim(),
                              description: newTaskDescription.trim(),
                              priority: newTaskPriority
                            }, {
                              onSuccess: () => {
                                setNewTaskTitle("");
                                setNewTaskDescription("");
                                setNewTaskPriority("Média");
                                setActiveAddTaskBacklogId(null);
                              }
                            });
                          }}
                          disabled={!newTaskTitle.trim() || createBacklogTaskMutation.isPending}
                          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
                        >
                          {createBacklogTaskMutation.isPending ? "Adicionando..." : "Criar Tarefa"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks list */}
              <div className="space-y-3">
                {!activeBacklog.tasks || activeBacklog.tasks.length === 0 ? (
                  <div className="text-center py-16 text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                    Nenhuma tarefa cadastrada nesta lista de backlog ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeBacklog.tasks.map((task) => {
                      const completedItems = task.checklists?.filter(i => i.completed).length || 0;
                      const totalItems = task.checklists?.length || 0;
                      const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : null;
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("taskId", task.id);
                            e.dataTransfer.setData("backlogId", activeBacklog.id);
                          }}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('select')) {
                              return;
                            }
                            setActiveCardId(task.id);
                            setIsCardModalOpen(true);
                          }}
                          className="bg-accent/10 border border-border rounded-2xl p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing group relative space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 pr-6">
                              {/* Tags list */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {task.tags.map(tag => (
                                    <span 
                                      key={tag.id} 
                                      className="text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-2xs"
                                      style={{ backgroundColor: tag.color }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <h5 className="font-bold text-sm text-foreground leading-snug">{task.title}</h5>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm("Deseja excluir esta tarefa?")) {
                                  deleteBacklogTaskMutation.mutate({ backlogId: activeBacklog.id, taskId: task.id });
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 absolute top-3 right-3 opacity-0 group-hover:opacity-100"
                              title="Excluir tarefa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded", PRIORITY_BADGES[task.priority])}>
                                {task.priority}
                              </span>

                              {totalItems > 0 && (
                                <div className={cn(
                                  "flex items-center gap-1 text-[9px] font-bold px-1 py-0.5 rounded",
                                  completedItems === totalItems ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                                )}>
                                  <span className="text-[10px]">✓</span>
                                  <span>{completedItems}/{totalItems}</span>
                                </div>
                              )}

                              {formattedDate && (
                                <div className={cn(
                                  "flex items-center gap-1 text-[9px] font-bold px-1 py-0.5 rounded",
                                  isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"
                                )}>
                                  <span>📅</span>
                                  <span>{formattedDate}</span>
                                </div>
                              )}
                            </div>

                            {/* Member avatars & Promote dropdown */}
                            <div className="flex items-center gap-3">
                              {/* Member avatars */}
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="flex -space-x-1.5 mr-1">
                                  {task.assignees.slice(0, 3).map((assignee) => (
                                    <div 
                                      key={assignee.id}
                                      className="w-5.5 h-5.5 rounded-full border border-card bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0 overflow-hidden"
                                      title={assignee.name || ""}
                                    >
                                      {assignee.image ? (
                                        <img src={assignee.image} alt={assignee.name || ""} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>
                                          {assignee.name
                                            ? assignee.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .substring(0, 2)
                                                .toUpperCase()
                                            : "??"}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {boards && boards.length > 0 && (
                                <div className="relative group/menu">
                                  <button
                                    type="button"
                                    className="p-1 rounded-lg hover:bg-accent text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-0.5 border border-border px-2"
                                  >
                                    Promover
                                    <ChevronRight size={10} className="rotate-90 animate-pulse" />
                                  </button>
                                  <div className="absolute right-0 bottom-full mb-1 w-48 bg-card border border-border rounded-xl shadow-xl z-20 hidden group-hover/menu:block py-1">
                                    <p className="text-[9px] text-muted-foreground px-3 py-1 border-b border-border font-bold uppercase tracking-wider">Enviar para quadro:</p>
                                    {boards.map((b) => (
                                      <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => {
                                          promoteBacklogTaskMutation.mutate({
                                            backlogId: activeBacklog.id,
                                            taskId: task.id,
                                            boardId: b.id
                                          });
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-primary hover:text-primary-foreground font-medium transition-colors truncate"
                                      >
                                        {b.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isCardModalOpen && activeCardId && (
        <CardModal
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setActiveCardId(null);
          }}
          cardId={activeCardId}
          boardId={boards?.[0]?.id}
        />
      )}

      {/* Project Settings Modal */}
      <ProjectSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        project={project as any} 
        initialTab={settingsTab} 
      />
    </div>
  );
}
