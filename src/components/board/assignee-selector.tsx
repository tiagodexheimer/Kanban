import React from "react";
import { User } from "@/hooks/use-kanban";
import { User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssigneeSelectorProps {
  availableUsers: User[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

export function AssigneeSelector({ availableUsers, selectedUserIds, onChange }: AssigneeSelectorProps) {
  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Responsáveis</label>
      <div className="flex flex-wrap gap-2">
        {availableUsers.map((user) => {
          const isSelected = selectedUserIds.includes(user.id);
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => toggleUser(user.id)}
              className={cn(
                "flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all text-sm",
                isSelected 
                  ? "bg-primary/10 border-primary text-primary" 
                  : "bg-accent/30 border-transparent text-muted-foreground hover:bg-accent"
              )}
            >
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {user.image ? (
                  <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={12} />
                )}
              </div>
              <span className="font-medium truncate max-w-[120px]">{user.name}</span>
              {isSelected && <X size={14} className="ml-1" />}
            </button>
          );
        })}
        {availableUsers.length === 0 && (
          <div className="text-xs text-muted-foreground italic p-2 bg-accent/20 rounded-xl w-full border border-dashed border-border/50">
            Convide membros para o projeto para atribuir tarefas.
          </div>
        )}
      </div>
    </div>
  );
}
