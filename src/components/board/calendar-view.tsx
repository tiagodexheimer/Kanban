"use client";

import React, { useState } from "react";
import { Column, Card as CardType } from "@/hooks/use-kanban";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  columns: Column[];
  onEditCard: (cardId: string, columnId: string) => void;
}

export function CalendarView({ columns, onEditCard }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const numDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const allCards = columns.flatMap(col => col.cards);

  const getCardsForDay = (day: number) => {
    return allCards.filter(card => {
      if (!card.dueDate) return false;
      
      const d = new Date(card.dueDate);
      
      // We check both UTC and Local date to be safe against timezone shifts
      // This ensures the task shows up on the day it was intended
      const matchesUTC = d.getUTCDate() === day && d.getUTCMonth() === month && d.getUTCFullYear() === year;
      const matchesLocal = d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      
      return matchesUTC || matchesLocal;
    });
  };

  const priorityColors: Record<string, string> = {
    Low: "bg-blue-500",
    Medium: "bg-yellow-500",
    High: "bg-orange-500",
    Urgent: "bg-red-500",
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <CalendarIcon size={20} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {monthNames[month]} <span className="text-muted-foreground font-medium">{year}</span>
          </h2>
          <span className="ml-4 px-3 py-1 bg-secondary rounded-full text-xs font-bold text-muted-foreground">
            {allCards.filter(c => c.dueDate).length} tarefas com prazo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border/50 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-semibold hover:bg-secondary rounded-xl transition-colors border border-border/50 shadow-sm"
          >
            Hoje
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border/50 shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-collapse">
        {daysOfWeek.map(day => (
          <div key={day} className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/10 border-b border-border">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          const cards = day !== null ? getCardsForDay(day) : [];
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div 
              key={index} 
              className={cn(
                "min-h-[140px] p-2 border-r border-b border-border last:border-r-0 transition-colors relative flex flex-col group/day",
                day === null ? "bg-muted/5" : "hover:bg-muted/10"
              )}
            >
              {day !== null && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 text-sm font-bold rounded-lg transition-all",
                      isToday
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                        : "text-foreground"
                    )}>
                      {day}
                    </div>
                    {cards.length > 0 && (
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md animate-pulse">
                        {cards.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[120px] custom-scrollbar pr-1">
                    {cards.length > 0 && cards.map(card => (
                      <div 
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCard(card.id, card.columnId);
                        }}
                        className="group/card flex flex-col p-2 bg-background border border-border/50 rounded-lg shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1",
                          priorityColors[card.priority] || "bg-primary"
                        )} />
                        <span className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight group-hover/card:text-primary transition-colors">
                          {card.title}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                           <span className="text-[9px] text-muted-foreground font-medium uppercase">{card.priority}</span>
                           {card.tags.length > 0 && (
                             <div className="flex gap-0.5">
                               {card.tags.slice(0, 3).map(tag => (
                                 <div 
                                   key={tag.id}
                                   className="w-1.5 h-1.5 rounded-full"
                                   style={{ backgroundColor: tag.color }}
                                   title={tag.name}
                                 />
                               ))}
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
