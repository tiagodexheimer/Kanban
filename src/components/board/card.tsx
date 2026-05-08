"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType } from "@/hooks/use-kanban";
import { cn } from "@/lib/utils";
import { GripVertical, Calendar, CheckCircle2 } from "lucide-react";

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  Low: "bg-blue-500/10 text-blue-500",
  Medium: "bg-yellow-500/10 text-yellow-500",
  High: "bg-orange-500/10 text-orange-500",
  Urgent: "bg-red-500/10 text-red-500",
};

export function Card({ card, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const completedItems = card.checklists?.filter(i => i.completed).length || 0;
  const totalItems = card.checklists?.length || 0;
  
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const formattedDate = card.dueDate ? new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3",
        isDragging && "opacity-50 grayscale"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", priorityColors[card.priority])}>
              {card.priority}
            </span>
            {card.tags?.map(tag => (
              <span 
                key={tag.id} 
                className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-sm"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          <h4 className="font-medium text-foreground leading-tight">{card.title}</h4>
        </div>
        <div className="p-1 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0">
          <GripVertical size={16} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
              completedItems === totalItems ? "bg-emerald-500/10 text-emerald-500" : "bg-accent text-muted-foreground"
            )}>
              <CheckCircle2 size={12} />
              <span>{completedItems}/{totalItems}</span>
            </div>
          )}
          
          {formattedDate && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
              isOverdue ? "bg-red-500/10 text-red-500" : "bg-accent text-muted-foreground"
            )}>
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
        
        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
          JD
        </div>
      </div>
    </div>
  );
}
