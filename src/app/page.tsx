import { Sidebar } from "@/components/layout/sidebar";
import { BoardView } from "@/components/board/board-view";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full bg-background p-0 overflow-hidden">
        <BoardView />
      </main>
    </div>
  );
}
