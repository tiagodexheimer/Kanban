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

  const deleteBacklogTaskMutation = useDeleteBacklogTask(projectId);
  const promoteBacklogTaskMutation = usePromoteBacklogTask(projectId);

  const [selectedBacklogId, setSelectedBacklogId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"geral" | "membros" | "backlogs">("backlogs");
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
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full animate-fadeIn">
          {/* Main Backlog List */}
          <div className="flex-1 w-full space-y-6">
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
                      setActiveCardId(null);
                      setIsCardModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1 self-start sm:self-auto"
                  >
                    <Plus size={13} />
                    Nova Tarefa
                  </button>
                </div>

                {/* Tasks list */}
                <div className="space-y-4">
                  {!activeBacklog.tasks || activeBacklog.tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl bg-accent/5 gap-4">
                      <p className="text-xs text-muted-foreground italic">Nenhuma tarefa cadastrada nesta lista de backlog ainda.</p>
                      <button
                        onClick={() => {
                          setActiveCardId(null);
                          setIsCardModalOpen(true);
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        Criar Primeira Tarefa
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
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

                        {/* Add Task Quick Card at the end of the grid */}
                        <button
                          onClick={() => {
                            setActiveCardId(null);
                            setIsCardModalOpen(true);
                          }}
                          className="flex flex-col items-center justify-center min-h-[140px] border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-all gap-2 p-4 cursor-pointer text-center group rounded-2xl"
                        >
                          <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-xs font-bold">Adicionar Tarefa</span>
                        </button>
                      </div>

                      {/* Add Task Button at the bottom of the container */}
                      <button 
                        onClick={() => {
                          setActiveCardId(null);
                          setIsCardModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all border border-dashed border-border hover:border-primary/50 cursor-pointer group"
                      >
                        <Plus size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        Adicionar Tarefa
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Boards Drop Zones Sidebar */}
          {boards && boards.length > 0 && (
            <div className="w-full lg:w-72 shrink-0 space-y-3 lg:sticky lg:top-6">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs font-black uppercase text-foreground tracking-wider mb-2">Quadros do Projeto</h4>
                <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed font-medium">Arraste tarefas do backlog e solte nestes espaços para promovê-las imediatamente para o respectivo quadro.</p>
                
                <div className="space-y-3">
                  {boards.map((b) => (
                    <div
                      key={b.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-primary/10', 'border-primary', 'scale-[1.02]');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-primary/10', 'border-primary', 'scale-[1.02]');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-primary/10', 'border-primary', 'scale-[1.02]');
                        const taskId = e.dataTransfer.getData("taskId");
                        const backlogId = e.dataTransfer.getData("backlogId");
                        if (taskId && backlogId) {
                          promoteBacklogTaskMutation.mutate({
                            backlogId,
                            taskId,
                            boardId: b.id
                          });
                        }
                      }}
                      className="p-4 border-2 border-dashed border-border rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[90px] group hover:border-primary/50 cursor-crosshair bg-accent/30"
                    >
                      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors text-center">{b.title}</span>
                      <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-widest bg-background/50 px-2 py-0.5 rounded border border-border/50">Soltar Tarefa</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isCardModalOpen && (
        <CardModal
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setActiveCardId(null);
          }}
          cardId={activeCardId || undefined}
          boardId={boards?.[0]?.id}
          backlogId={activeBacklog?.id}
          projectId={projectId}
        />
      )}

      {/* Project Settings Modal */}
      <ProjectSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        project={project as any} 
        initialTab="backlogs"
        backlogsOnly={true}
      />
    </div>
  );
}
