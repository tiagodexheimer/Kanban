"use client";

import React, { useState } from "react";
import { Plus, X, Search, Link as LinkIcon, ShieldAlert } from "lucide-react";
import { Card, Board, useAddDependency, useUpdateCard } from "@/hooks/use-omnitask";
import { cn } from "@/lib/utils";

interface DependencyEditorProps {
  card?: Partial<Card>;
  board?: Board;
  blockedByIds?: string[];
  blockingIds?: string[];
  relatedToIds?: string[];
  onBlockedByChange?: (ids: string[]) => void;
  onBlockingChange?: (ids: string[]) => void;
  onRelatedToChange?: (ids: string[]) => void;
}

export function DependencyEditor({ 
  card, 
  board,
  blockedByIds: propBlockedByIds,
  blockingIds: propBlockingIds,
  relatedToIds: propRelatedToIds,
  onBlockedByChange,
  onBlockingChange,
  onRelatedToChange
}: DependencyEditorProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const addDependencyMutation = useAddDependency();
  const updateCardMutation = useUpdateCard();

  const allCards = board?.columns?.flatMap(c => c.cards) || [];
  
  // Use props if available (creation mode), otherwise use card data (edit mode)
  const currentBlockedByIds = propBlockedByIds || card?.blockedBy?.map(d => d.id) || [];
  const currentBlockingIds = propBlockingIds || card?.blocking?.map(d => d.id) || [];
  const currentRelatedToIds = propRelatedToIds || card?.relatedTo?.map(d => d.id) || [];

  const blockedBy = allCards.filter(c => currentBlockedByIds.includes(c.id));
  const blocking = allCards.filter(c => currentBlockingIds.includes(c.id));
  const relatedTo = allCards.filter(c => currentRelatedToIds.includes(c.id));

  const searchResults = searchTerm.trim() === "" ? [] : allCards
    .filter(c => 
      c.id !== card?.id && 
      !currentBlockedByIds.includes(c.id) &&
      !currentBlockingIds.includes(c.id) &&
      !currentRelatedToIds.includes(c.id) &&
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5);

  const handleAddRelation = (dependencyId: string, type: 'blockedBy' | 'blocking' | 'relatedTo') => {
    if (onBlockedByChange || onBlockingChange || onRelatedToChange) {
      // Creation mode / Controlled mode
      if (type === 'blockedBy' && onBlockedByChange) onBlockedByChange([...currentBlockedByIds, dependencyId]);
      if (type === 'blocking' && onBlockingChange) onBlockingChange([...currentBlockingIds, dependencyId]);
      if (type === 'relatedTo' && onRelatedToChange) onRelatedToChange([...currentRelatedToIds, dependencyId]);
    } else if (card?.id) {
      // Edit mode (Direct mutation)
      addDependencyMutation.mutate({ cardId: card.id, dependencyId, type });
    }
    setIsSearching(false);
    setSearchTerm("");
  };

  const handleRemoveRelation = (dependencyId: string, type: 'blockedBy' | 'blocking' | 'relatedTo') => {
    if (onBlockedByChange || onBlockingChange || onRelatedToChange) {
      if (type === 'blockedBy' && onBlockedByChange) onBlockedByChange(currentBlockedByIds.filter(id => id !== dependencyId));
      if (type === 'blocking' && onBlockingChange) onBlockingChange(currentBlockingIds.filter(id => id !== dependencyId));
      if (type === 'relatedTo' && onRelatedToChange) onRelatedToChange(currentRelatedToIds.filter(id => id !== dependencyId));
    } else if (card?.id) {
      let newIds: string[] = [];
      if (type === 'blockedBy') {
        newIds = currentBlockedByIds.filter(id => id !== dependencyId);
        updateCardMutation.mutate({ id: card.id, blockedByIds: newIds });
      } else if (type === 'blocking') {
        newIds = currentBlockingIds.filter(id => id !== dependencyId);
        updateCardMutation.mutate({ id: card.id, blockingIds: newIds });
      } else if (type === 'relatedTo') {
        newIds = currentRelatedToIds.filter(id => id !== dependencyId);
        updateCardMutation.mutate({ id: card.id, relatedToIds: newIds });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Blocked By */}
        {blockedBy && blockedBy.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert size={10} className="text-destructive" />
              Bloqueado por
            </span>
            <div className="flex flex-wrap gap-2">
              {blockedBy.map(dep => (
                <RelationBadge 
                  key={dep.id} 
                  title={dep.title || "Tarefa"} 
                  onRemove={() => handleRemoveRelation(dep.id, 'blockedBy')}
                  variant="destructive"
                />
              ))}
            </div>
          </div>
        )}

        {/* Blocking */}
        {blocking && blocking.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bloqueando</span>
            <div className="flex flex-wrap gap-2">
              {blocking.map(dep => (
                <RelationBadge 
                  key={dep.id} 
                  title={dep.title || "Tarefa"} 
                  onRemove={() => handleRemoveRelation(dep.id, 'blocking')}
                  variant="warning"
                />
              ))}
            </div>
          </div>
        )}

        {/* Related To */}
        {relatedTo && relatedTo.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <LinkIcon size={10} />
              Relacionado a
            </span>
            <div className="flex flex-wrap gap-2">
              {relatedTo.map(dep => (
                <RelationBadge 
                  key={dep.id} 
                  title={dep.title || "Tarefa"} 
                  onRemove={() => handleRemoveRelation(dep.id, 'relatedTo')}
                  variant="info"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {!isSearching ? (
        <button
          onClick={() => setIsSearching(true)}
          className="flex items-center gap-2 text-xs font-medium text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-all"
        >
          <Plus size={14} />
          Adicionar Relação
        </button>
      ) : (
        <div className="space-y-2 bg-accent/10 p-3 rounded-xl border border-border/30 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-2">
            <Search size={14} className="text-muted-foreground" />
            <input 
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar tarefas..."
              className="flex-1 bg-transparent border-none text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={() => setIsSearching(false)}>
              <X size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map(result => (
                <div key={result.id} className="p-2 rounded-lg hover:bg-accent/30 flex items-center justify-between group">
                  <span className="text-xs font-medium truncate max-w-[150px]">{result.title}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleAddRelation(result.id, 'blockedBy')}
                      className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded hover:bg-destructive hover:text-white transition-all"
                    >
                      Bloquear
                    </button>
                    <button 
                      onClick={() => handleAddRelation(result.id, 'relatedTo')}
                      className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-all"
                    >
                      Relacionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() !== "" && (
            <div className="text-[10px] text-muted-foreground text-center py-2 italic">Nenhuma tarefa encontrada</div>
          )}
        </div>
      )}
    </div>
  );
}

function RelationBadge({ title, onRemove, variant = 'info' }: { title: string, onRemove: () => void, variant?: 'info' | 'destructive' | 'warning' }) {
  const variants = {
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  };

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-semibold animate-in zoom-in duration-300", variants[variant])}>
      <span className="truncate max-w-[120px]">{title}</span>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }} className="hover:opacity-70">
        <X size={12} />
      </button>
    </div>
  );
}
