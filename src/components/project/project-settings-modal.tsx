"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Project, useUpdateProjectMember, useRemoveProjectMember, useDeleteProject, useUpdateProject, useInviteToProject } from "@/hooks/use-omnitask";
import { useBacklogs, useCreateBacklog, useDeleteBacklog, useUpdateBacklog } from "@/hooks/use-backlog";
import { User, Trash2, Shield, Settings, Users, X, AlertTriangle, UserPlus, Inbox, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  initialTab?: "geral" | "membros" | "backlogs";
  backlogsOnly?: boolean;
}

export function ProjectSettingsModal({ isOpen, onClose, project, initialTab = "membros", backlogsOnly }: ProjectSettingsModalProps) {
  const updateMember = useUpdateProjectMember();
  const removeMember = useRemoveProjectMember();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const inviteMember = useInviteToProject();

  const { data: backlogs } = useBacklogs(project.id);
  const createBacklog = useCreateBacklog(project.id);
  const deleteBacklog = useDeleteBacklog(project.id);
  const updateBacklog = useUpdateBacklog(project.id);

  const [activeTab, setActiveTab] = useState<"geral" | "membros" | "backlogs">(initialTab);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newBacklogTitle, setNewBacklogTitle] = useState("");
  const [editingBacklogId, setEditingBacklogId] = useState<string | null>(null);
  const [editingBacklogTitle, setEditingBacklogTitle] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTitle(project.title);
      setDescription(project.description || "");
      setNewBacklogTitle("");
      setEditingBacklogId(null);
    }
  }, [isOpen, initialTab, project]);

  const roles = [
    { value: "OWNER", label: "Dono", desc: "Controle total" },
    { value: "ADMIN", label: "Admin", desc: "Gerencia membros e boards" },
    { value: "MEMBER", label: "Membro", desc: "Edita tarefas e boards" },
    { value: "VIEWER", label: "Observador", desc: "Apenas visualização" },
  ];

  const handleUpdate = () => {
    updateProject.mutate({ id: project.id, title, description }, {
      onSuccess: () => onClose()
    });
  };

  const handleDelete = () => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${project.title}"? Todos os quadros e dados serão removidos permanentemente.`)) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        onClose();
        window.location.href = "/";
      }
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMember.mutate({ projectId: project.id, email: inviteEmail }, {
      onSuccess: () => setInviteEmail("")
    });
  };

  const handleCreateBacklog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBacklogTitle.trim()) return;
    createBacklog.mutate({ title: newBacklogTitle.trim() }, {
      onSuccess: () => setNewBacklogTitle("")
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configurações: ${project.title}`} size="lg">
      <div className="flex flex-col h-full max-h-[70vh]">
        {!backlogsOnly && (
          <div className="flex gap-4 border-b border-border mb-4">
            <button 
              onClick={() => setActiveTab("geral")}
              className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all", activeTab === "geral" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Geral
            </button>
            <button 
              onClick={() => setActiveTab("membros")}
              className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all", activeTab === "membros" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Membros
            </button>
            <button 
              onClick={() => setActiveTab("backlogs")}
              className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all", activeTab === "backlogs" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Backlogs
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === "geral" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Título do Projeto</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Descrição</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none h-24"
                />
              </div>
              <div className="pt-4 border-t border-border mt-8">
                <h4 className="text-sm font-bold text-destructive mb-2">Zona de Perigo</h4>
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
                  <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                    <AlertTriangle size={16} />
                    Excluir Projeto
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta ação é irreversível. Todos os boards e tarefas deste projeto serão apagados.
                  </p>
                  <button 
                    onClick={handleDelete}
                    disabled={deleteProject.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:opacity-90 transition-all text-xs font-bold"
                  >
                    <Trash2 size={14} />
                    {deleteProject.isPending ? "Excluindo..." : "Excluir Definitivamente"}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "membros" ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                  <UserPlus size={14} />
                  CONVIDAR NOVO MEMBRO
                </h4>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="E-mail do usuário"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button 
                    type="submit"
                    disabled={inviteMember.isPending}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {inviteMember.isPending ? "Enviando..." : "Convidar"}
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between mt-6">
                <h4 className="text-sm font-bold">Gerenciar Membros ({project.members.length})</h4>
              </div>

              <div className="space-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/50 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {member.user.image ? (
                          <img src={member.user.image} alt={member.user.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          (member.user.name || "U").substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{member.user.name || "Sem Nome"}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email || ""}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={member.role}
                        onChange={(e) => updateMember.mutate({ projectId: project.id, userId: member.userId, role: e.target.value })}
                        className="bg-accent border border-border rounded-md text-xs p-1.5 focus:ring-1 focus:ring-primary outline-none"
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      
                      {member.role !== "OWNER" && (
                        <button 
                          onClick={() => removeMember.mutate({ projectId: project.id, userId: member.userId })}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* BACKLOGS TAB */
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                  <Inbox size={14} />
                  CRIAR NOVO BACKLOG
                </h4>
                <form onSubmit={handleCreateBacklog} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome do backlog..."
                    value={newBacklogTitle}
                    onChange={(e) => setNewBacklogTitle(e.target.value)}
                    required
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button 
                    type="submit"
                    disabled={createBacklog.isPending}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {createBacklog.isPending ? "Criando..." : "Criar"}
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between mt-6">
                <h4 className="text-sm font-bold">Gerenciar Listas de Backlog ({backlogs?.length || 0})</h4>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {!backlogs || backlogs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                    Nenhum backlog neste projeto.
                  </div>
                ) : (
                  backlogs.map((backlog) => (
                    <div key={backlog.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/50">
                      {editingBacklogId === backlog.id ? (
                        <div className="flex-1 flex gap-2 mr-2">
                          <input
                            type="text"
                            value={editingBacklogTitle}
                            onChange={(e) => setEditingBacklogTitle(e.target.value)}
                            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                          />
                          <button
                            onClick={() => {
                              if (!editingBacklogTitle.trim()) return;
                              updateBacklog.mutate({ backlogId: backlog.id, title: editingBacklogTitle.trim() }, {
                                onSuccess: () => setEditingBacklogId(null)
                              });
                            }}
                            className="bg-primary text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingBacklogId(null)}
                            className="bg-accent text-foreground px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Inbox size={16} className="text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-bold">{backlog.title}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {backlog.tasks?.length || 0} {backlog.tasks?.length === 1 ? "tarefa" : "tarefas"}
                            </span>
                          </div>
                        </div>
                      )}

                      {editingBacklogId !== backlog.id && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingBacklogId(backlog.id);
                              setEditingBacklogTitle(backlog.title);
                            }}
                            className="px-2 py-1 hover:bg-primary/20 rounded text-xs font-bold text-primary transition-all"
                          >
                            Renomear
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o backlog "${backlog.title}" e todas as suas tarefas?`)) {
                                deleteBacklog.mutate(backlog.id);
                              }
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                            title="Excluir backlog"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleUpdate}
            disabled={updateProject.isPending}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {updateProject.isPending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
