import { Sidebar } from "@/components/layout/sidebar";
import { BoardView } from "@/components/board/board-view";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <div className="flex-1 min-h-0">
          <BoardView />
        </div>
      </main>
    </div>
  );
}
