import React, { useState } from "react";
import { useComments, useCreateComment, User } from "@/hooks/use-omnitask";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, User as UserIcon } from "lucide-react";

interface CommentSectionProps {
  cardId: string;
}

export function CommentSection({ cardId }: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(cardId);
  const createCommentMutation = useCreateComment();
  const [text, setText] = useState("");

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!text.trim()) return;

    createCommentMutation.mutate({ cardId, text }, {
      onSuccess: () => setText("")
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Comentários</h3>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-4 animate-pulse text-muted-foreground text-sm">Carregando comentários...</div>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {comment.user.image ? (
                  <img src={comment.user.image} alt={comment.user.name || ""} className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <UserIcon size={14} className="text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{comment.user.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {(() => {
                      const date = new Date(comment.createdAt);
                      const isMoreThan24h = (Date.now() - date.getTime()) > 24 * 60 * 60 * 1000;
                      
                      return isMoreThan24h 
                        ? format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
                    })()}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 text-sm text-foreground border border-border/50">
                  {comment.text}
                </div>
              </div>
            </div>
          ))
        )}
        {!isLoading && comments?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm italic">Nenhum comentário ainda. Seja o primeiro!</div>
        )}
      </div>

      <div className="flex gap-2 items-end pt-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário..."
          className="flex-1 bg-accent/30 border border-border/50 rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none min-h-[40px] max-h-[120px]"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }
          }}
        />
        <button
          disabled={!text.trim() || createCommentMutation.isPending}
          type="button"
          onClick={handleSubmit}
          className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
