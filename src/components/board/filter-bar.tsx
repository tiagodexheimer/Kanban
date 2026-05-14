"use client";

import React from "react";
import { Search, LayoutGrid, List, Calendar, Filter, X, ChevronDown, BarChart3 } from "lucide-react";
import { useViewStore, ViewType } from "@/store/use-view-store";
import { Tag } from "@/hooks/use-omnitask";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  tags: Tag[];
}

export function FilterBar({ tags }: FilterBarProps) {
  const { 
    currentView, 
    setView, 
    filters, 
    setSearch, 
    togglePriority, 
    toggleTag, 
    resetFilters 
  } = useViewStore();

  const priorities = ["Low", "Medium", "High", "Urgent"];
  const priorityLabels: Record<string, string> = {
    Low: "Baixa",
    Medium: "Média",
    High: "Alta",
    Urgent: "Urgente",
  };

  const hasActiveFilters = filters.search !== "" || filters.priorities.length > 0 || filters.tags.length > 0;

  return (
    <div className="flex flex-col gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        {/* View Switcher */}
        <div className="flex p-1 bg-secondary/50 rounded-xl backdrop-blur-sm border border-border/50">
          <button
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              currentView === "board" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Quadro
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              currentView === "list" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              currentView === "calendar" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4 h-4" />
            Calendário
          </button>
          <button
            onClick={() => setView("dashboard")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              currentView === "dashboard" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar tarefas..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Priority Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-center mr-2">Prioridade:</span>
          {priorities.map((priority) => (
            <button
              key={priority}
              onClick={() => togglePriority(priority)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                filters.priorities.includes(priority)
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-background border-border text-muted-foreground hover:border-muted-foreground"
              )}
            >
              {priorityLabels[priority] || priority}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2 flex-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-center mr-2">Etiquetas:</span>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                filters.tags.includes(tag.id)
                  ? "border-foreground/50 shadow-sm"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              style={{ 
                backgroundColor: filters.tags.includes(tag.id) ? tag.color : `${tag.color}20`,
                color: filters.tags.includes(tag.id) ? "white" : tag.color,
                borderColor: filters.tags.includes(tag.id) ? tag.color : "transparent"
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: filters.tags.includes(tag.id) ? "white" : tag.color }} 
              />
              {tag.name}
            </button>
          ))}
          {tags.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Nenhuma etiqueta criada</span>
          )}
        </div>
      </div>
    </div>
  );
}
