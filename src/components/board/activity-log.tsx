import React from "react";
import { useActivities, useCardActivities, Activity } from "@/hooks/use-omnitask";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, User as UserIcon, MessageSquare, Plus, ArrowRight, Trash2, Layout } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLogProps {
  boardId?: string;
  cardId?: string;
  title?: string;
  maxHeight?: string;
}

export function ActivityLog({ boardId, cardId, title = "Atividades", maxHeight = "400px" }: ActivityLogProps) {
  const { data: boardActivities, isLoading: isLoadingBoard } = useActivities(boardId || "");
  const { data: cardActivities, isLoading: isLoadingCard } = useCardActivities(cardId || "");

  const activities = cardId ? cardActivities : boardActivities;
  const isLoading = cardId ? isLoadingCard : isLoadingBoard;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CREATE_CARD": return <Plus size={12} className="text-green-500" />;
      case "MOVE_CARD": return <ArrowRight size={12} className="text-blue-500" />;
      case "ADD_COMMENT": return <MessageSquare size={12} className="text-purple-500" />;
      case "DELETE_CARD": return <Trash2 size={12} className="text-red-500" />;
      case "UPDATE_CARD": return <History size={12} className="text-amber-500" />;
      case "CREATE_COLUMN": return <Layout size={12} className="text-indigo-500" />;
      default: return <History size={12} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <History size={16} className="text-muted-foreground" />
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>

      <div 
        className={cn("space-y-4 overflow-y-auto pr-2 custom-scrollbar")} 
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="text-center py-8 animate-pulse text-muted-foreground text-sm italic">
            Carregando histórico...
          </div>
        ) : activities?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm italic border-2 border-dashed border-border/50 rounded-xl">
            Nenhuma atividade registrada ainda.
          </div>
        ) : (
          <div className="relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/30">
            {activities?.map((activity) => (
              <div key={activity.id} className="relative pl-9 pb-6 last:pb-0 animate-in fade-in slide-in-from-left-2">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center z-10 shadow-sm">
                  {activity.user.image ? (
                    <img src={activity.user.image} alt="" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <UserIcon size={12} className="text-muted-foreground" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-foreground leading-tight">
                      <span className="font-bold">{activity.user.name || "Usuário"}</span>
                      {" "}{activity.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-secondary/50 px-1.5 py-0.5 rounded">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {activity.card && !cardId && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Layout size={10} />
                      Tarefa: <span className="font-medium text-primary hover:underline cursor-pointer">{activity.card.title}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
