"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Star,
  Search,
  LogOut,
  User as UserIcon,
  Plus,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();

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

      <div className="p-4 border-t border-border space-y-4">
        {session?.user && (
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-accent/30 overflow-hidden transition-all",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full rounded-lg object-cover" />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-foreground">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
              </div>
            )}
          </div>
        )}

        {session ? (
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-semibold">Sair</span>}
          </button>
        ) : (
          <Link 
            href="/auth/signin"
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <UserIcon size={20} />
            {!isCollapsed && <span className="font-semibold">Entrar</span>}
          </Link>
        )}

        <button className={cn(
          "w-full flex items-center gap-3 bg-primary p-2.5 rounded-xl text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95",
          isCollapsed ? "justify-center px-0" : ""
        )}>
          <Plus size={20} />
          {!isCollapsed && <span className="font-semibold">Novo Board</span>}
        </button>
      </div>
    </aside>
  );
}
