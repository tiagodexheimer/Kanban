"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { 
  useBoard, 
  useCustomFields, 
  useDeleteBoard, 
  useUpdateBoardPermission, 
  useBoardMembers,
  useUpdateBoard
} from "@/hooks/use-omnitask";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Type, Hash, Calendar, DollarSign, List, Shield, AlertTriangle, Eye, Edit3, Move, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function BoardSettingsModal({ isOpen, onClose, boardId }: BoardSettingsModalProps) {
  const queryClient = useQueryClient();
  const { data: board } = useBoard(boardId);
  const { data: fields } = useCustomFields(boardId);
  const { data: memberData } = useBoardMembers(boardId);
  const deleteBoardMutation = useDeleteBoard();
  const updatePermission = useUpdateBoardPermission();
  const updateBoardMutation = useUpdateBoard();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");
  const [activeTab, setActiveTab] = useState<"geral" | "campos" | "permissões" | "danger">("geral");

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

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    
    await fetch(`/api/boards/${boardId}/fields`, {
      method: "POST",
      body: JSON.stringify({
        name: newFieldName,
        type: newFieldType,
        options: newFieldType === "DROPDOWN" ? ["Opção 1"] : null
      })
    });
    
    setNewFieldName("");
    queryClient.invalidateQueries({ queryKey: ["custom-fields", boardId] });
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Deseja apagar este campo? Os valores salvos nos cards serão perdidos.")) return;
    await fetch(`/api/boards/${boardId}/fields/${fieldId}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["custom-fields", boardId] });
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
            onClick={() => setActiveTab("campos")}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap", activeTab === "campos" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
          >
            Campos Customizados
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

          {activeTab === "campos" && (
            <div className="space-y-6">
              <div>
                <div className="space-y-2 mb-4">
                  {fields?.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                        {getFieldIcon(field.type)}
                        <div>
                          <p className="text-sm font-bold">{field.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{field.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-accent/30 rounded-2xl space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Adicionar Novo Campo</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Nome do campo"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="bg-background border border-border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select 
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="bg-background border border-border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="TEXT">Texto</option>
                      <option value="NUMBER">Número</option>
                      <option value="DATE">Data</option>
                      <option value="CURRENCY">Moeda</option>
                      <option value="DROPDOWN">Seleção</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleAddField}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                  >
                    <Plus size={16} />
                    Criar Campo
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
