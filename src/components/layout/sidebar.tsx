"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FolderKanban,
  Star,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Boards", active: true },
    { icon: Star, label: "Favoritos" },
    { icon: Search, label: "Busca" },
    { icon: FolderKanban, label: "Projetos" },
    { icon: Settings, label: "Configurações" },
  ];

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border transition-all duration-300 flex flex-col sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!isCollapsed && <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Kanban</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2 px-3">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
              item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon size={20} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      <div className="p-4 mt-auto">
        <button className={cn(
          "w-full flex items-center gap-3 bg-primary p-2.5 rounded-lg text-primary-foreground hover:opacity-90 transition-opacity",
          isCollapsed ? "justify-center px-0" : ""
        )}>
          <Plus size={20} />
          {!isCollapsed && <span className="font-semibold">Novo Board</span>}
        </button>
      </div>
    </aside>
  );
}
