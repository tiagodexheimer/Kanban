"use client";

import { useBoards } from "@/hooks/use-omnitask";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Plus } from "lucide-react";
import { useCreateBoard } from "@/hooks/use-omnitask";

export default function DashboardPage() {
  const { data: boards, isLoading } = useBoards();
  const router = useRouter();
  const createBoardMutation = useCreateBoard();

  useEffect(() => {
    if (!isLoading && boards && boards.length > 0) {
      // Redirect to the first board automatically
      router.replace(`/boards/${boards[0].id}`);
    }
  }, [boards, isLoading, router]);

  const handleCreateBoard = () => {
    const title = prompt("Título do novo quadro:");
    if (!title) return;
    createBoardMutation.mutate({ title, description: "Novo quadro criado" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we reach here, it means there are no boards
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative p-6 bg-card border border-border rounded-3xl shadow-2xl">
          <LayoutDashboard className="text-primary" size={48} />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">Bem-vindo ao OmniTask</h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          Você ainda não possui nenhum quadro Kanban. Crie um agora para começar a gerenciar seus projetos e tarefas.
        </p>
      </div>
      <button 
        onClick={handleCreateBoard}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
      >
        <Plus size={18} />
        Criar Meu Primeiro Quadro
      </button>
    </div>
  );
}
