import { Sidebar } from "@/components/layout/sidebar";
import { BoardView } from "@/components/board/board-view";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Kanban</h1>
            <p className="text-muted-foreground">Visualize e organize suas tarefas diárias.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Espaço para filtros ou perfil */}
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <BoardView />
        </div>
      </main>
    </div>
  );
}
