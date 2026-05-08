import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  cardId: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  priority: string;
  tags: Tag[];
  checklists: ChecklistItem[];
  position: number;
  columnId: string;
  dueDate?: string | Date | null;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  tags: Tag[];
}

export function useBoards() {
  return useQuery<Board[]>({
    queryKey: ["boards"],
    queryFn: async () => {
      const res = await fetch("/api/boards");
      if (!res.ok) throw new Error("Failed to fetch boards");
      return res.json();
    },
  });
}

export function useBoard(boardId: string) {
  return useQuery<Board>({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error("Failed to fetch board");
      return res.json();
    },
    enabled: !!boardId,
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tagIds, ...data }: Partial<Card> & { id: string; tagIds?: string[] }) => {
      const res = await fetch(`/api/cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, tagIds }),
      });
      return res.json();
    },
    onMutate: async ({ id, ...newData }) => {
      await queryClient.cancelQueries({ queryKey: ["board"] });
      const previousBoard = queryClient.getQueryData<Board>(["board"]);

      if (previousBoard) {
        queryClient.setQueryData<Board>(["board"], (old) => {
          if (!old) return old;
          
          const newColumns = old.columns.map(col => {
            let newCards = col.cards.filter(c => c.id !== id);
            
            if (col.id === newData.columnId) {
              const card = old.columns.flatMap(c => c.cards).find(c => c.id === id);
              if (card) {
                const updatedCard = { ...card, ...newData } as Card;
                newCards.push(updatedCard);
                newCards.sort((a, b) => a.position - b.position);
              }
            } else if (!newData.columnId) {
              const card = col.cards.find(c => c.id === id);
              if (card) {
                newCards = col.cards.map(c => c.id === id ? { ...c, ...newData } : c) as Card[];
              }
            }
            
            return { ...col, cards: newCards };
          });

          return { ...old, columns: newColumns };
        });
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board"], context.previousBoard);
      }
      toast.error("Erro ao sincronizar tarefa");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; columnId: string; position: number }) => {
      const res = await fetch("/api/cards", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar tarefa");
    }
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/cards/${id}`, { method: "DELETE" });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["board"] });
      const previousBoard = queryClient.getQueryData<Board>(["board"]);

      if (previousBoard) {
        queryClient.setQueryData<Board>(["board"], (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: old.columns.map(col => ({
              ...col,
              cards: col.cards.filter(c => c.id !== id)
            }))
          };
        });
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board"], context.previousBoard);
      }
      toast.error("Erro ao excluir tarefa");
    },
    onSuccess: () => {
      toast.success("Tarefa excluída");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; boardId: string; position: number }) => {
      const res = await fetch("/api/columns", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      toast.success("Coluna criada!");
    },
    onError: () => {
      toast.error("Erro ao criar coluna");
    }
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Column> & { id: string }) => {
      const res = await fetch(`/api/columns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onMutate: async (newColumn) => {
      await queryClient.cancelQueries({ queryKey: ["board"] });
      const previousBoard = queryClient.getQueryData<Board>(["board"]);

      if (previousBoard) {
        queryClient.setQueryData<Board>(["board"], (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: old.columns.map(col => 
              col.id === newColumn.id ? { ...col, ...newColumn } : col
            ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          };
        });
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board"], context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/columns/${id}`, { method: "DELETE" });
    },
    onMutate: async (columnId) => {
      await queryClient.cancelQueries({ queryKey: ["board"] });
      const previousBoard = queryClient.getQueryData<Board>(["board"]);

      if (previousBoard) {
        queryClient.setQueryData<Board>(["board"], (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: old.columns.filter(col => col.id !== columnId)
          };
        });
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board"], context.previousBoard);
      }
      toast.error("Erro ao excluir lista");
    },
    onSuccess: () => {
      toast.success("Lista excluída");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

// Checklist Hooks
export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { text: string; cardId: string; position: number }) => {
      const res = await fetch("/api/checklists", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    }
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChecklistItem> & { id: string }) => {
      const res = await fetch(`/api/checklists/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    }
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/checklists/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    }
  });
}

// Tag Hooks
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color: string; boardId: string }) => {
      const res = await fetch("/api/tags", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      toast.success("Etiqueta criada!");
    },
    onError: () => {
      toast.error("Erro ao criar etiqueta");
    }
  });
}
