"use client";

import React from "react";
import { Card, Column, CustomField } from "@/hooks/use-omnitask";
import { Calendar, Tag as TagIcon, MoreHorizontal, CheckCircle2, Hash, Type, DollarSign, List, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListViewProps {
  columns: Column[];
  onEditCard: (cardId: string, columnId: string) => void;
  customFields?: CustomField[];
}

export function ListView({ columns, onEditCard, customFields = [] }: ListViewProps) {
  const allCardsWithColumn = columns.flatMap(col => 
    col.cards.map(card => ({ ...card, columnName: col.title }))
  );

  const priorityColors = {
    Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    Urgent: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const priorityLabels: Record<string, string> = {
    Low: "Baixa",
    Medium: "Média",
    High: "Alta",
    Urgent: "Urgente",
  };

  if (allCardsWithColumn.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground italic border-2 border-dashed border-border rounded-2xl">
        Nenhuma tarefa encontrada com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-bottom border-border">
            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest w-1/3">Tarefa</th>
            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Lista</th>
            
            {/* Custom Fields Headers */}
            {customFields.slice(0, 3).map(field => (
              <th key={field.id} className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  {getFieldIcon(field.type)}
                  {field.name}
                </div>
              </th>
            ))}

            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Prioridade</th>
            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Data</th>
            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Tempo</th>
            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Etiquetas</th>
            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {allCardsWithColumn.map((card) => (
            <tr 
              key={card.id} 
              onClick={() => onEditCard(card.id, card.columnId)}
              className="group hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    card.columnName === "Done" ? "bg-green-500" : "bg-primary"
                  )} />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs font-medium">
                  {card.columnName}
                </span>
              </td>
              
              {/* Custom Fields Values */}
              {customFields.slice(0, 3).map(field => {
                const value = card.customFieldValues?.find(v => v.customFieldId === field.id)?.value;
                return (
                  <td key={field.id} className="px-6 py-4">
                    <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                      {value || <span className="opacity-30 italic">--</span>}
                    </span>
                  </td>
                );
              })}
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                  priorityColors[card.priority as keyof typeof priorityColors] || priorityColors.Medium
                )}>
                  {priorityLabels[card.priority] || card.priority}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {card.dueDate ? (
                    new Date(card.dueDate).toLocaleDateString("pt-BR")
                  ) : (
                    <span className="opacity-40 italic">Sem data</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {(() => {
                  const totalLoggedTime = card.timeLogs
                    ? card.timeLogs.filter(log => log.endTime !== null).reduce((sum, log) => sum + (log.duration || 0), 0)
                    : 0;
                  const hasRunningTimer = card.timeLogs
                    ? card.timeLogs.some(log => log.endTime === null)
                    : false;

                  const formatDurationBadge = (seconds: number) => {
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    if (hrs > 0) return `${hrs}h ${mins}m`;
                    return `${mins}m`;
                  };

                  if (totalLoggedTime === 0 && !hasRunningTimer) {
                    return <span className="text-[10px] text-muted-foreground opacity-40">--</span>;
                  }

                  return (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border",
                      hasRunningTimer 
                        ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 animate-pulse font-extrabold" 
                        : "bg-accent text-muted-foreground border-border/50"
                    )}>
                      <Clock size={12} className={cn(hasRunningTimer && "animate-spin-slow")} />
                      {formatDurationBadge(totalLoggedTime)}
                    </span>
                  );
                })()}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {card.tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {card.tags.length === 0 && <span className="text-[10px] text-muted-foreground opacity-40">--</span>}
                </div>
              </td>
              <td className="px-6 py-4">
                <button className="p-1 hover:bg-secondary rounded-md opacity-0 group-hover:opacity-100 transition-all">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getFieldIcon(type: string) {
  const props = { size: 12, className: "text-muted-foreground" };
  switch (type) {
    case "NUMBER": return <Hash {...props} />;
    case "TEXT": return <Type {...props} />;
    case "DATE": return <Calendar {...props} />;
    case "CURRENCY": return <DollarSign {...props} />;
    case "DROPDOWN": return <List {...props} />;
    default: return <Type {...props} />;
  }
}
