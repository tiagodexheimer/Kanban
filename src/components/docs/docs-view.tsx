"use client";

import React, { useState, useEffect } from "react";
import { useDocs, useCreateDoc, useUpdateDoc, useDeleteDoc } from "@/hooks/use-omnitask";
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor";
import { 
  FileText, Plus, Trash2, Search, 
  ChevronRight, Book, Clock, 
  Settings, MoreVertical, Layout,
  FilePlus, History, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useRouter } from "next/navigation";

interface DocsViewProps {
  projectId?: string;
  boardId?: string;
  docId?: string;
}

export function DocsView({ projectId, boardId, docId }: DocsViewProps) {
  const { data: docs, isLoading } = useDocs(projectId, boardId);
  const createDocMutation = useCreateDoc();
  const updateDocMutation = useUpdateDoc();
  const deleteDocMutation = useDeleteDoc();

  const router = useRouter();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docId || null);
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedDoc = docs?.find(d => d.id === selectedDocId);

  useEffect(() => {
    if (docId) {
      setSelectedDocId(docId);
    }
  }, [docId]);

  useEffect(() => {
    if (selectedDoc) {
      setLocalTitle(selectedDoc.title);
      setLocalContent(selectedDoc.content || "");
    }
  }, [selectedDoc]);

  // Auto-save logic
  useEffect(() => {
    if (!selectedDocId || !selectedDoc) return;
    
    const timeout = setTimeout(() => {
      if (localTitle !== selectedDoc.title || localContent !== (selectedDoc.content || "")) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [localTitle, localContent]);

  const handleSave = async () => {
    if (!selectedDocId) return;
    setIsSaving(true);
    try {
      await updateDocMutation.mutateAsync({
        id: selectedDocId,
        title: localTitle,
        content: localContent
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () => {
    const cleanProjectId = projectId && projectId !== "null" && projectId !== "undefined" ? projectId : undefined;
    const cleanBoardId = boardId && boardId !== "null" && boardId !== "undefined" ? boardId : undefined;

    createDocMutation.mutate({
      title: "Sem título",
      content: "",
      projectId: cleanProjectId,
      boardId: cleanBoardId
    }, {
      onSuccess: (data) => {
        router.push(`/docs/${data.id}`);
      },
      onError: (error: any) => {
        console.error("Create doc error:", error);
        toast.error("Erro ao criar documento: " + (error.message || "Erro desconhecido"));
      }
    });
  };

  const filteredDocs = docs?.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background/50 rounded-3xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700">
      {/* Docs Sidebar */}
      <div className="w-72 border-r border-border flex flex-col bg-card/50 backdrop-blur-xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Book className="text-primary" size={20} />
              <h3 className="font-bold text-lg">OmniDocs</h3>
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
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted/50 border border-border/50 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {filteredDocs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-muted-foreground/20 mb-4" size={48} />
              <p className="text-xs text-muted-foreground font-medium px-4">Nenhum documento encontrado</p>
            </div>
          ) : (
            filteredDocs?.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/docs/${doc.id}`)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                  selectedDocId === doc.id 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <FileText size={18} className={cn(selectedDocId === doc.id ? "text-primary" : "text-muted-foreground opacity-50")} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold truncate leading-tight">{doc.title || "Sem título"}</p>
                  <p className="text-[10px] opacity-60 truncate">
                    {format(new Date(doc.updatedAt), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <ChevronRight size={14} className={cn("opacity-0 transition-all", selectedDocId === doc.id ? "opacity-100 translate-x-0" : "group-hover:opacity-100 -translate-x-2")} />
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 text-primary border border-primary/10">
             <Layout size={18} />
             <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-tighter">Espaço de Trabalho</p>
               <p className="text-xs font-bold truncate">Wiki do Projeto</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedDoc ? (
          <>
            <div className="p-6 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <input 
                  type="text" 
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Título do Documento"
                  className="text-2xl font-black bg-transparent border-none focus:outline-none w-full placeholder:opacity-20 transition-all hover:bg-muted/5 p-1 rounded-lg"
                />
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    <Clock size={12} />
                    Editado {format(new Date(selectedDoc.updatedAt), "HH:mm", { locale: ptBR })}
                  </span>
                  {isSaving && (
                    <span className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider animate-pulse">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      Salvando...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-accent rounded-xl text-muted-foreground transition-all" title="Histórico">
                  <History size={20} />
                </button>
                <button className="p-2 hover:bg-accent rounded-xl text-muted-foreground transition-all" title="Compartilhar">
                  <Share2 size={20} />
                </button>
                <div className="w-px h-6 bg-border mx-2" />
                <button 
                  onClick={() => {
                    if (confirm("Deseja realmente excluir este documento?")) {
                      deleteDocMutation.mutate(selectedDoc.id, {
                        onSuccess: () => router.push('/docs')
                      });
                    }
                  }}
                  className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
                <button className="p-2 hover:bg-accent rounded-xl text-muted-foreground transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 xl:p-16 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="max-w-4xl mx-auto">
                <RichTextEditor 
                  content={localContent}
                  onChange={setLocalContent}
                  placeholder="Comece sua documentação incrível aqui..."
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-dots-grid">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative p-8 bg-card border border-border rounded-3xl shadow-2xl">
                <FilePlus className="text-primary" size={64} />
              </div>
            </div>
            <h2 className="text-3xl font-black mb-4">Bem-vindo ao OmniDocs</h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Crie wikis, manuais e documentações completas para o seu time. Tudo em um só lugar, sincronizado com seus projetos.
            </p>
            <button 
              onClick={handleCreate}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
            >
              <Plus size={24} />
              Criar Novo Documento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
