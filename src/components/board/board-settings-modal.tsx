"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { useBoard, useCustomFields } from "@/hooks/use-kanban";
import { Plus, Trash2, Type, Hash, Calendar, DollarSign, List } from "lucide-react";

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function BoardSettingsModal({ isOpen, onClose, boardId }: BoardSettingsModalProps) {
  const { data: board } = useBoard(boardId);
  const { data: fields } = useCustomFields(boardId);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");

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
    // Invalidate queries would be better here, but I'll use a reload for simplicity in this step or trust React Query
    window.location.reload(); 
  };
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Deseja apagar este campo? Os valores salvos nos cards serão perdidos.")) return;
    
    await fetch(`/api/boards/${boardId}/fields/${fieldId}`, {
      method: "DELETE"
    });
    
    window.location.reload();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações do Quadro">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-4">Campos Customizados</h3>
          
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
