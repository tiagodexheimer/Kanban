"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { 
  useBoard, 
  useDeleteBoard, 
  useUpdateBoardPermission, 
  useBoardMembers,
  useUpdateBoard,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn
} from "@/hooks/use-omnitask";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Type, Hash, Calendar, DollarSign, List, Shield, AlertTriangle, Eye, Edit3, Move, Settings as SettingsIcon, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function BoardSettingsModal({ isOpen, onClose, boardId }: BoardSettingsModalProps) {
  const queryClient = useQueryClient();
  const { data: board } = useBoard(boardId);
  const { data: memberData } = useBoardMembers(boardId);
  const deleteBoardMutation = useDeleteBoard();
  const updatePermission = useUpdateBoardPermission();
  const updateBoardMutation = useUpdateBoard();
  const createColumnMutation = useCreateColumn();
  const updateColumnMutation = useUpdateColumn();
  const deleteColumnMutation = useDeleteColumn();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"geral" | "listas" | "permissões" | "danger">("geral");

  // State for creating new columns in the settings modal
  const [newColTitle, setNewColTitle] = useState("");
  const [newColType, setNewColType] = useState("TODO");
  const [newColColor, setNewColColor] = useState("#eab308");

  const canManage = board?.userPermissions?.canManageBoard;
  const members = memberData?.projectMembers || [];

  React.useEffect(() => {
    if (board && isOpen) {
      setTitle(board.title || "");
      setDescription(board.description || "");
    }
  }, [board, isOpen]);

  const handleTogglePermission = (userId: string, key: string, value: boolean) => {
    updatePermission.mutate({
      boardId,
      userId,
      [key]: value
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      }
    });
  };

  const handleDeleteBoard = () => {
    if (!confirm("Tem certeza que deseja excluir este quadro? Todas as tarefas, colunas e dados serão removidos permanentemente.")) return;
    deleteBoardMutation.mutate(boardId, {
      onSuccess: () => {
        onClose();
        window.location.href = "/";
      }
    });
  };

  const handleSaveGeneral = () => {
    if (!title.trim()) return;
    updateBoardMutation.mutate({
      boardId,
      title,
      description
    });
  };

  const handleCreateCol = () => {
    if (!newColTitle.trim()) return;
    createColumnMutation.mutate({
      title: newColTitle,
      boardId,
      position: (board?.columns?.length || 0) + 1,
      type: newColType,
      color: newColColor
    }, {
      onSuccess: () => {
        setNewColTitle("");
        queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações do Quadro" size="lg">
      <div className="flex flex-col h-full max-h-[75vh]">
        <div className="flex gap-2 md:gap-4 border-b border-border mb-6 overflow-x-auto scrollbar-none shrink-0">
          <button 
            onClick={() => setActiveTab("geral")}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap", activeTab === "geral" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
          >
            Geral
          </button>
          <button 
            onClick={() => setActiveTab("listas")}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap", activeTab === "listas" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
          >
            Listas
          </button>

          {canManage && (
            <>
              <button 
                onClick={() => setActiveTab("permissões")}
                className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap", activeTab === "permissões" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
              >
                Permissões
              </button>
              <button 
                onClick={() => setActiveTab("danger")}
                className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap", activeTab === "danger" ? "border-destructive text-destructive" : "border-transparent text-muted-foreground")}
              >
                Zona de Perigo
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === "geral" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nome do Quadro</label>
                  <input 
                    type="text" 
                    placeholder="Nome do quadro"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Descrição</label>
                  <textarea 
                    placeholder="Descrição do quadro (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full resize-none"
                  />
                </div>

                <button 
                  onClick={handleSaveGeneral}
                  disabled={updateBoardMutation.isPending || !title.trim()}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {updateBoardMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "listas" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground italic bg-accent/20 p-3 rounded-xl border border-border/50">
                  Gerencie as colunas do seu quadro, edite seus títulos, vincule ao status adequado para controle de progresso e defina suas cores.
                </p>

                <div className="space-y-3">
                  {board?.columns?.map((col) => (
                    <div key={col.id} className="p-3.5 rounded-2xl bg-accent/10 border border-border/40 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={col.title}
                          onChange={(e) => updateColumnMutation.mutate({ id: col.id, title: e.target.value })}
                          className="bg-transparent hover:bg-accent/30 focus:bg-background border border-transparent focus:border-border rounded-lg px-2.5 py-1 text-sm font-bold w-full outline-none transition-all"
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <select 
                          value={col.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            let defaultColor = col.color;
                            if (newType === "TODO") defaultColor = "#eab308";
                            else if (newType === "IN_PROGRESS") defaultColor = "#3b82f6";
                            else if (newType === "DONE") defaultColor = "#22c55e";
                            updateColumnMutation.mutate({ id: col.id, type: newType as any, color: defaultColor });
                          }}
                          className="bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="TODO">A Fazer (TODO)</option>
                          <option value="IN_PROGRESS">Em Progresso (Doing)</option>
                          <option value="DONE">Concluído (Done)</option>
                        </select>

                        <div className="flex gap-1 bg-background/50 border border-border/50 rounded-xl p-1 shrink-0">
                          {["#eab308", "#3b82f6", "#22c55e", "#7c3aed", "#ef4444", "#ec4899", "#f97316", "#64748b"].map(c => (
                            <button 
                              key={c}
                              onClick={() => updateColumnMutation.mutate({ id: col.id, color: c })}
                              className={cn(
                                "w-4 h-4 rounded-full transition-all border",
                                col.color === c ? "border-foreground scale-110" : "border-transparent"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>

                        <button 
                          onClick={() => {
                            if (confirm(`Deseja excluir a lista "${col.title}" e todas as suas tarefas?`)) {
                              deleteColumnMutation.mutate(col.id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                          title="Excluir Lista"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-accent/30 rounded-2xl space-y-4 mt-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adicionar Nova Lista</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Nome da lista (ex: Testes, Backlog)"
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      className="bg-background border border-border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary w-full font-semibold"
                    />
                    
                    <select 
                      value={newColType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewColType(val);
                        if (val === "TODO") setNewColColor("#eab308");
                        else if (val === "IN_PROGRESS") setNewColColor("#3b82f6");
                        else if (val === "DONE") setNewColColor("#22c55e");
                      }}
                      className="bg-background border border-border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary w-full font-semibold"
                    >
                      <option value="TODO">A Fazer (TODO)</option>
                      <option value="IN_PROGRESS">Em Progresso (Doing)</option>
                      <option value="DONE">Concluído (Done)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Cor da Nova Lista</span>
                    <div className="flex gap-2">
                      {["#eab308", "#3b82f6", "#22c55e", "#7c3aed", "#ef4444", "#ec4899", "#f97316", "#64748b"].map(c => (
                        <button 
                          type="button"
                          key={c}
                          onClick={() => setNewColColor(c)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all border-2",
                            newColColor === c ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateCol}
                    disabled={!newColTitle.trim() || createColumnMutation.isPending}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {createColumnMutation.isPending ? "Criando..." : "Criar Nova Lista"}
                  </button>
                </div>
              </div>
            </div>
          )}



          {activeTab === "permissões" && (
            <div className="space-y-4">
              <div className="bg-accent/20 p-4 rounded-xl border border-border/50 flex items-center gap-3 mb-4">
                <Shield size={20} className="text-primary" />
                <p className="text-xs text-muted-foreground italic">
                  Defina o que cada membro do projeto pode fazer especificamente neste quadro. Papéis de Dono/Admin ignoram estas restrições.
                </p>
              </div>

              <div className="space-y-4">
                {members.map((member) => {
                  const perm = memberData?.boardPermissions?.find(p => p.userId === member.userId);
                  const isUserOwner = member.role === "OWNER" || member.role === "ADMIN";
                  
                  return (
                    <div key={member.id} className="p-4 rounded-xl bg-accent/10 border border-border/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                            {member.user.image ? <img src={member.user.image} alt="" className="w-full h-full object-cover" /> : (member.user.name || "U").substring(0,2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{member.user.name || "Sem Nome"}</p>
                            <p className="text-[10px] text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        {isUserOwner && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">Acesso Total</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <PermissionToggle 
                          icon={<Eye size={14} />} 
                          label="Ver" 
                          active={isUserOwner || perm?.canView !== false} 
                          disabled={isUserOwner}
                          onChange={(val) => handleTogglePermission(member.userId, "canView", val)}
                        />
                        <PermissionToggle 
                          icon={<Edit3 size={14} />} 
                          label="Editar" 
                          active={isUserOwner || perm?.canEditTasks !== false} 
                          disabled={isUserOwner}
                          onChange={(val) => handleTogglePermission(member.userId, "canEditTasks", val)}
                        />
                        <PermissionToggle 
                          icon={<Move size={14} />} 
                          label="Mover" 
                          active={isUserOwner || perm?.canMoveTasks !== false} 
                          disabled={isUserOwner}
                          onChange={(val) => handleTogglePermission(member.userId, "canMoveTasks", val)}
                        />
                        <PermissionToggle 
                          icon={<SettingsIcon size={14} />} 
                          label="Config" 
                          active={isUserOwner || perm?.canManageBoard === true} 
                          disabled={isUserOwner}
                          onChange={(val) => handleTogglePermission(member.userId, "canManageBoard", val)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
                <div className="flex items-center gap-2 text-destructive font-bold">
                  <AlertTriangle size={20} />
                  Cuidado: Ação Irreversível
                </div>
                <p className="text-sm text-muted-foreground">
                  Ao excluir este quadro, todos os dados associados (tarefas, colunas, comentários, histórico) serão apagados permanentemente.
                </p>
                <button 
                  onClick={handleDeleteBoard}
                  disabled={deleteBoardMutation.isPending}
                  className="w-full py-2.5 bg-destructive text-white rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleteBoardMutation.isPending ? "Excluindo..." : "Sim, excluir quadro agora"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function getFieldIcon(type: string) {
  const props = { size: 16, className: "text-primary" };
  switch (type) {
    case "NUMBER": return <Hash {...props} />;
    case "TEXT": return <Type {...props} />;
    case "DATE": return <Calendar {...props} />;
    case "CURRENCY": return <DollarSign {...props} />;
    case "DROPDOWN": return <List {...props} />;
    default: return <Type {...props} />;
  }
}

function PermissionToggle({ icon, label, active, disabled, onChange }: { icon: any, label: string, active: boolean, disabled: boolean, onChange: (val: boolean) => void }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-all text-[11px] font-bold",
        active 
          ? "bg-primary/10 border-primary/30 text-primary" 
          : "bg-accent/30 border-transparent text-muted-foreground grayscale opacity-50",
        disabled && "cursor-not-allowed"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
