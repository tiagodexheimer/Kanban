"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  useWhiteboards, 
  useWhiteboard, 
  useCreateWhiteboard, 
  useUpdateWhiteboard, 
  useDeleteWhiteboard 
} from "@/hooks/use-omnitask";
import { toast } from "sonner";
import "@excalidraw/excalidraw/index.css";
import { 
  Palette, Plus, Trash2, Search, 
  ChevronRight, MousePointer2, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Dynamic import for Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface WhiteboardViewProps {
  projectId?: string;
  boardId?: string;
  isActive?: boolean;
}

export function WhiteboardView({ projectId, boardId, isActive }: WhiteboardViewProps) {
  const { data: whiteboards, isLoading } = useWhiteboards(projectId, boardId);
  const createMutation = useCreateWhiteboard();
  const updateMutation = useUpdateWhiteboard();
  const deleteMutation = useDeleteWhiteboard();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedWB, isLoading: isLoadingWB } = useWhiteboard(selectedId!);
  const [localTitle, setLocalTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  
  const elementsRef = useRef<any[]>([]);
  const appStateRef = useRef<any>({});
  const isUpdatingSceneRef = useRef(false);
  const lastLoadedIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Sync state from URL (handles direct links and browser back/forward buttons)
  useEffect(() => {
    if (!isActive) return;
    const wbIdFromUrl = searchParams.get("wb");
    
    if (wbIdFromUrl && wbIdFromUrl !== selectedId) {
      setSelectedId(wbIdFromUrl);
    } else if (!wbIdFromUrl && !selectedId && whiteboards && whiteboards.length > 0) {
      // Auto-select first whiteboard if none is selected
      const firstId = whiteboards[0].id;
      setSelectedId(firstId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("wb", firstId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [isActive, searchParams, selectedId, whiteboards, pathname, router]);

  // Scene restoration and state sync
  useEffect(() => {
    if (selectedWB && selectedId === selectedWB.id && selectedId !== lastLoadedIdRef.current) {
      lastLoadedIdRef.current = selectedId;
      isUpdatingSceneRef.current = true;
      hasLoadedRef.current = false;
      
      setLocalTitle(selectedWB.title);
      try {
        const parsed = JSON.parse(selectedWB.data);
        const newElements = parsed.elements || [];
        const newAppState = parsed.appState || {};
        
        elementsRef.current = newElements;
        appStateRef.current = newAppState;
        hasLoadedRef.current = true;
      } catch (e) {
        console.error("Failed to parse whiteboard data", e);
      }
      
      setTimeout(() => {
        isUpdatingSceneRef.current = false;
      }, 500);
    }
  }, [selectedWB, selectedId]);

  // Auto-save logic
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCanvasChange = (newElements: any[], newAppState: any) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Prevent saves before we've even finished loading the initial state
    if (!hasLoadedRef.current || isUpdatingSceneRef.current) {
      return;
    }
    
    // Suspicious empty change right after loading or when we know we have elements
    if (newElements.length === 0 && elementsRef.current.length > 0) {
      console.warn("Ignoring suspicious empty canvas change event");
      return;
    }

    elementsRef.current = newElements;
    appStateRef.current = newAppState;

    saveTimeoutRef.current = setTimeout(() => {
      console.log("Auto-saving whiteboard...", selectedId);
      handleSave(newElements, newAppState);
    }, 3000);
  };

  const handleSave = async (currentElements = elementsRef.current, currentAppState = appStateRef.current) => {
    if (!selectedId || !hasLoadedRef.current) return;
    
    // If it's empty, and we haven't even loaded yet, definitely don't save
    if (currentElements.length === 0 && elementsRef.current.length === 0 && !hasLoadedRef.current) {
      return;
    }

    console.log("Saving whiteboard data, length:", JSON.stringify({ elements: currentElements, appState: currentAppState }).length);
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        title: localTitle,
        data: JSON.stringify({ elements: currentElements, appState: currentAppState })
      });
      toast.success("Quadro salvo com sucesso!");
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () => {
    createMutation.mutate({
      title: "Novo Quadro Branco",
      data: JSON.stringify({ elements: [], appState: {} }),
      projectId,
      boardId
    }, {
      onSuccess: (data) => {
        // Prepare local state for the new board immediately
        elementsRef.current = [];
        appStateRef.current = {};
        lastLoadedIdRef.current = data.id;
        hasLoadedRef.current = true;
        isUpdatingSceneRef.current = false;
        setLocalTitle("Novo Quadro Branco");
        
        if (excalidrawAPI) {
          excalidrawAPI.updateScene({
            elements: [],
            appState: { theme: "light" },
            commitToHistory: true
          });
        }
        
        setSelectedId(data.id);
        const params = new URLSearchParams(searchParams.toString());
        params.set("wb", data.id);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    });
  };

  const handleSelectWhiteboard = (id: string) => {
    setSelectedId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("wb", id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selectedWBData = whiteboards?.find(w => w.id === selectedId);
  const isActuallyLoading = isLoadingWB && !selectedWB;
  
  const initialData = useMemo(() => {
    if (!selectedWB) return null;
    try {
      const parsed = JSON.parse(selectedWB.data);
      return {
        elements: parsed.elements || [],
        appState: { 
          ...parsed.appState, 
          theme: "light",
          collaborators: new Map()
        }
      };
    } catch (e) {
      return { 
        elements: [], 
        appState: { 
          theme: "light",
          collaborators: new Map()
        } 
      };
    }
  }, [selectedWB?.id]); // Only recompute when the ID changes

  const filteredWBs = whiteboards?.filter(w => 
    w.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-background/50 rounded-3xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700">
      {/* Sidebar */}
      <div className="w-60 border-r border-border flex flex-col bg-card/50 backdrop-blur-xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Palette className="text-primary" size={20} />
              <h3 className="font-bold text-lg">OmniCanvas</h3>
            </div>
            <button 
              onClick={handleCreate}
              className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={14} />
            <input 
              type="text" 
              placeholder="Buscar quadros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted/50 border border-border/50 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {filteredWBs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MousePointer2 className="text-muted-foreground/20 mb-4" size={48} />
              <p className="text-xs text-muted-foreground font-medium px-4">Nenhum quadro branco</p>
            </div>
          ) : (
            filteredWBs?.map((wb) => (
              <button
                key={wb.id}
                onClick={() => handleSelectWhiteboard(wb.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                  selectedId === wb.id 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Palette size={18} className={cn(selectedId === wb.id ? "text-primary" : "text-muted-foreground opacity-50")} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold truncate leading-tight">{wb.title || "Sem título"}</p>
                  <p className="text-[10px] opacity-60 truncate">
                    {format(new Date(wb.updatedAt), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <ChevronRight size={14} className={cn("opacity-0 transition-all", selectedId === wb.id ? "opacity-100 translate-x-0" : "group-hover:opacity-100 -translate-x-2")} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        <div className={cn("flex-1 flex flex-col", (!selectedId || (!selectedWB && !isActuallyLoading)) && "hidden")}>
          <div className="p-4 border-b border-border bg-card/30 backdrop-blur-md z-10 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <input 
                type="text" 
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => handleSave()}
                className="text-lg font-bold bg-transparent border-none focus:outline-none placeholder:opacity-20 transition-all hover:bg-muted/5 px-2 py-1 rounded-lg"
              />
              {isSaving && (
                <span className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Salvando...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleSave()}
                className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all" 
                title="Salvar agora"
              >
                <Save size={20} />
              </button>
              <button 
                onClick={() => {
                  if (confirm("Deseja realmente excluir este quadro branco?")) {
                    deleteMutation.mutate(selectedId!, {
                      onSuccess: () => {
                        setSelectedId(null);
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete("wb");
                        router.push(`${pathname}?${params.toString()}`, { scroll: false });
                      }
                    });
                  }
                }}
                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"
                title="Excluir"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full relative border-t border-border flex flex-col min-h-0">
            {isActuallyLoading || !initialData ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-medium text-muted-foreground animate-pulse">Sincronizando quadro...</p>
                </div>
              </div>
            ) : (
              <div key={selectedId} className="absolute inset-0 overflow-hidden">
                <Excalidraw 
                  excalidrawAPI={(api) => setExcalidrawAPI(api)}
                  onChange={handleCanvasChange}
                  langCode="pt-BR"
                  initialData={initialData}
                />
              </div>
            )}
          </div>
        </div>

        {(!selectedId || !selectedWB) && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative p-8 bg-card border border-border rounded-3xl shadow-2xl">
                <Palette className="text-primary" size={64} />
              </div>
            </div>
            <h2 className="text-3xl font-black mb-4">Desenhe suas Ideias</h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Crie diagramas, fluxogramas e esboços livres. Tudo sincronizado com seu time em tempo real.
            </p>
            <button 
              onClick={handleCreate}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
            >
              <Plus size={24} />
              Criar Novo Quadro Branco
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
