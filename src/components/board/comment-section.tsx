import React, { useState, useRef, useEffect, useMemo } from "react";
import { useComments, useCreateComment, User as UserType } from "@/hooks/use-omnitask";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, User as UserIcon, AtSign, CheckCircle2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  cardId: string;
  board?: any;
}

export function CommentSection({ cardId, board }: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(cardId);
  const createCommentMutation = useCreateComment();
  const [text, setText] = useState("");
  
  // Mentions State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get users and tasks for mentions
  const users = useMemo(() => {
    const members = board?.project?.members?.map((m: any) => m.user) || [];
    const owner = board?.owner ? [board.owner] : [];
    
    // Combine and remove duplicates by ID
    const all = [...members, ...owner];
    const unique = new Map();
    all.forEach(u => {
      if (u && u.id && !unique.has(u.id)) {
        unique.set(u.id, u);
      }
    });
    return Array.from(unique.values());
  }, [board]);

  const tasks = useMemo(() => {
    return board?.allCards || [];
  }, [board]);

  const suggestions = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    const userSugg = users
      .filter((u: any) => u.name?.toLowerCase().includes(q))
      .map((u: any) => ({ id: u.id, name: u.name, type: "user" as const }));
    
    const taskSugg = tasks
      .filter((t: any) => t.title?.toLowerCase().includes(q))
      .map((t: any) => ({ 
        id: t.id, 
        name: t.title, 
        type: (t.parentId ? "subtask" : "task") as "task" | "subtask"
      }));

    return [...userSugg, ...taskSugg].slice(0, 8);
  }, [users, tasks, mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setText(val);
    setCursorPos(pos);

    // Detect @ mention
    const textBeforeCursor = val.slice(0, pos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtPos !== -1 && (lastAtPos === 0 || textBeforeCursor[lastAtPos - 1] === " ")) {
      const query = textBeforeCursor.slice(lastAtPos + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (mention: any) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = text.slice(cursorPos);
    
    const mentionText = `@${mention.name} `;
    const newText = text.slice(0, lastAtPos) + mentionText + textAfterCursor;
    
    setText(newText);
    setShowMentions(false);
    
    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = lastAtPos + mentionText.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (suggestions[mentionIndex]) {
          insertMention(suggestions[mentionIndex]);
        }
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!text.trim()) return;

    createCommentMutation.mutate({ cardId, text }, {
      onSuccess: () => setText("")
    });
  };

  // Helper to render text with colored mentions
  const renderCommentText = (content: string) => {
    if (!content) return null;

    // First, find all possible mention strings (longest first to avoid partial matches)
    const allMentionables = [
      ...users.map((u: any) => ({ name: u.name, type: "user" as const })),
      ...tasks.map((t: any) => ({ name: t.title, type: (t.parentId ? "subtask" : "task") as "subtask" | "task" }))
    ]
      .filter((item: any) => !!item.name)
      .sort((a: any, b: any) => b.name.length - a.name.length);

    // If no mentionables, just return text
    if (allMentionables.length === 0) return content;

    // Create a regex that matches @ followed by any of the mentionable names
    const escapedNames = allMentionables.map((m: any) => 
      m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(@(?:${escapedNames.join("|")}))`, "g");

    const parts = content.split(regex);
    
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const nameOnly = part.slice(1);
        const mentionable = allMentionables.find(m => m.name === nameOnly);
        
        if (mentionable) {
          return (
            <span key={i} className="inline-flex items-center gap-1 text-primary font-bold bg-primary/5 px-1.5 py-0.5 rounded-md leading-none align-middle">
              {mentionable.type === "user" ? <UserIcon size={12} className="shrink-0" /> : 
               mentionable.type === "subtask" ? <Layers size={12} className="shrink-0" /> : 
               <CheckCircle2 size={12} className="shrink-0" />}
              <span className="translate-y-[0.5px]">{part}</span>
            </span>
          );
        }
      }
      return part;
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
                <div className="p-3 rounded-2xl bg-accent/30 text-sm text-foreground border border-border/50 whitespace-pre-wrap">
                  {renderCommentText(comment.text)}
                </div>
              </div>
            </div>
          ))
        )}
        {!isLoading && comments?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm italic">Nenhum comentário ainda. Seja o primeiro!</div>
        )}
      </div>

      <div className="relative flex gap-2 items-end pt-2">
        {/* Mentions Dropdown */}
        {showMentions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 w-64 bg-card border border-border rounded-xl shadow-2xl mb-2 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-2 border-b border-border bg-muted/30 flex items-center gap-2">
              <AtSign size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mencionar</span>
            </div>
            <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.id}`}
                  onClick={() => insertMention(s)}
                  onMouseEnter={() => setMentionIndex(i)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all",
                    mentionIndex === i ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.type === "user" ? <UserIcon size={14} /> : <CheckCircle2 size={14} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{s.name}</p>
                    <p className="text-[10px] opacity-50 uppercase tracking-tighter font-black">
                      {s.type === "user" ? "Membro" : s.type === "subtask" ? "Subtarefa" : "Tarefa"}
                    </p>
                  </div>
                  {mentionIndex === i && <Send size={12} className="opacity-50" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um comentário... Use @ para mencionar"
          className="flex-1 bg-accent/30 border border-border/50 rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none min-h-[40px] max-h-[120px]"
          rows={1}
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
