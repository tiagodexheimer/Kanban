"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { useCreateProject } from "@/hooks/use-omnitask";
import { useRouter } from "next/navigation";
import { Plus, X, Users, Mail, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const createProjectMutation = useCreateProject();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [boardTitles, setBoardTitles] = useState<string[]>(["Quadro Geral"]);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  // Reset inputs when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setBoardTitles(["Quadro Geral"]);
      setEmailInput("");
      setEmails([]);
    }
  }, [isOpen]);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;
    if (!email.includes("@")) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    if (emails.includes(email)) {
      setEmailInput("");
      return;
    }
    setEmails([...emails, email]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createProjectMutation.mutate({
      title,
      description,
      boardTitles,
      initialMembers: emails,
    }, {
      onSuccess: (data) => {
        onClose();
        router.push(`/projects/${data.id}`);
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Projeto" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* General Fields */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome do Projeto</label>
              <input 
                type="text" 
                placeholder="Ex: Marketing Digital, Redesign do Site"
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
                placeholder="Descreva brevemente o escopo e objetivo deste projeto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full resize-none"
              />
            </div>
          </div>

          {/* Initial Boards List and Naming */}
          <div className="space-y-3 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LayoutGrid size={16} />
                <label className="text-xs font-bold uppercase tracking-wide">Quadros do Projeto</label>
              </div>
              <button
                type="button"
                onClick={() => setBoardTitles([...boardTitles, `Quadro ${boardTitles.length + 1}`])}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Plus size={14} />
                Adicionar Quadro
              </button>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Dê nomes personalizados para os quadros que serão criados com este projeto.</p>

            {boardTitles.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted-foreground text-xs font-medium">
                Nenhum quadro inicial. O projeto será criado vazio.
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {boardTitles.map((boardTitle, index) => (
                  <div key={index} className="flex items-center gap-3 bg-accent/20 p-2 rounded-xl border border-border/50">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Nome do quadro..."
                      value={boardTitle}
                      onChange={(e) => {
                        const newTitles = [...boardTitles];
                        newTitles[index] = e.target.value;
                        setBoardTitles(newTitles);
                      }}
                      required
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary flex-1 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setBoardTitles(boardTitles.filter((_, i) => i !== index))}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members list and add form */}
          <div className="space-y-3 border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={16} />
              <label className="text-xs font-bold uppercase tracking-wide">Convidar Membros da Equipe</label>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="Ex: colaborador@empresa.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const email = emailInput.trim();
                      if (email) {
                        if (!email.includes("@")) {
                          toast.error("Por favor, insira um e-mail válido.");
                          return;
                        }
                        if (!emails.includes(email)) {
                          setEmails([...emails, email]);
                        }
                        setEmailInput("");
                      }
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const email = emailInput.trim();
                  if (email) {
                    if (!email.includes("@")) {
                      toast.error("Por favor, insira um e-mail válido.");
                      return;
                    }
                    if (!emails.includes(email)) {
                      setEmails([...emails, email]);
                    }
                    setEmailInput("");
                  }
                }}
                className="px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground border border-border rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            {/* List of emails added */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-accent/20 rounded-xl border border-border/50">
                {emails.map((email) => (
                  <div key={email} className="flex items-center gap-1.5 bg-background border border-border pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium text-foreground shadow-sm">
                    <span className="truncate max-w-[200px]">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="p-0.5 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-border/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createProjectMutation.isPending || !title.trim()}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {createProjectMutation.isPending ? "Criando..." : "Criar Projeto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
