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

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  user: User;
  cardId: string;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  tags: Tag[];
  assignees: User[];
  checklists: ChecklistItem[];
  comments?: Comment[];
  position: number;
  columnId: string;
  backlogId?: string | null;
  dueDate?: string | Date | null;
  customFieldValues?: CustomFieldValue[];
  parentId?: string;
  parent?: Card;
  subtasks?: Card[];
  blockedBy?: { id: string; title?: string }[];
  blocking?: { id: string; title?: string }[];
  relatedTo?: { id: string; title?: string }[];
  relatesTo?: { id: string; title?: string }[];
  timeLogs?: { id: string; duration: number | null; endTime: string | Date | null }[];
  weight?: number;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  cards: Card[];
  color?: string;
  type: "TODO" | "IN_PROGRESS" | "DONE";
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  folderId?: string;
  columns: Column[];
  allCards?: { id: string; title: string; parentId?: string | null }[];
  tags: Tag[];
  customFields: CustomField[];
  owner?: User;
  permissions: {
    userId: string;
    canView: boolean;
    canEditTasks: boolean;
    canMoveTasks: boolean;
    canManageBoard: boolean;
    user: User;
  }[];
  userPermissions?: {
    canView: boolean;
    canEditTasks: boolean;
    canMoveTasks: boolean;
    canManageBoard: boolean;
  };
  project?: Project;
}

export interface BacklogTask {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | Date | null;
  backlogId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Backlog {
  id: string;
  title: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  tasks: BacklogTask[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner: User;
  members: {
    id: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
    user: User;
  }[];
  boards?: Board[];
  folders?: Folder[];
  backlogs?: Backlog[];
  updatedAt: string;
}

export interface Folder {
  id: string;
  title: string;
  projectId: string;
  boards: Board[];
}

export interface CustomField {
  id: string;
  name: string;
  type: string;
  options?: string;
}

export interface CustomFieldValue {
  id: string;
  value: string | null;
  customFieldId: string;
  cardId: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  user: User;
  boardId: string;
  cardId?: string;
  card?: { id: string; title: string };
  createdAt: string;
}

export interface BoardStats {
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  burnDownData: { date: string; remaining: number; ideal: number }[];
  productivityData: { date: string; completed: number }[];
  summary: {
    total: number;
    done: number;
    pending: number;
  };
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

// Project Hooks
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      description?: string; 
      boardTitles?: string[]; 
      backlogTitles?: string[]; 
      initialMembers?: string[]; 
    }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useInviteToProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, email }: { projectId: string; email: string }) => {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to invite user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Usuário convidado!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; projectId?: string; folderId?: string }) => {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create board");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
      toast.success("Quadro criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar quadro");
    }
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, title, description }: { boardId: string; title?: string; description?: string }) => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error("Failed to update board");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board", data.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
      toast.success("Quadro atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar quadro");
    }
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

export function useBoardMembers(boardId: string) {
  return useQuery<{ projectMembers: any[], boardPermissions: any[] }>({
    queryKey: ["board-members", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (!res.ok) throw new Error("Failed to fetch board members");
      return res.json();
    },
    enabled: !!boardId,
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tagIds, assigneeIds, blockedByIds, blockingIds, relatedToIds, ...data }: Partial<Card> & { 
      id: string; 
      tagIds?: string[]; 
      assigneeIds?: string[];
      blockedByIds?: string[];
      blockingIds?: string[];
      relatedToIds?: string[];
    }) => {
      const res = await fetch(`/api/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tagIds, assigneeIds, blockedByIds, blockingIds, relatedToIds }),
      });
      return res.json();
    },
    onMutate: async ({ id, ...newData }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["board"] });
      await queryClient.cancelQueries({ queryKey: ["card", id] });

      // Snapshot the previous values
      const previousBoards = queryClient.getQueriesData<Board>({ queryKey: ["board"] });
      const previousCards = queryClient.getQueriesData<Card>({ queryKey: ["card"] });

      // Optimistically update any card query (could be the card itself or a parent containing it as subtask)
      queryClient.setQueriesData<Card>({ queryKey: ["card"] }, (old) => {
        if (!old) return old;
        
        // If it's the card itself being updated
        if (old.id === id) {
          return { ...old, ...newData } as Card;
        }

        // If it's a parent card, check its subtasks
        if (old.subtasks) {
          const hasSubtask = old.subtasks.some(s => s.id === id);
          if (hasSubtask) {
            return {
              ...old,
              subtasks: old.subtasks.map(s => s.id === id ? { ...s, ...newData } : s)
            } as Card;
          }
        }

        return old;
      });

      // Optimistically update to the new value in the boards
      queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (old) => {
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

      return { previousBoards, previousCards };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoards) {
        context.previousBoards.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousCards) {
        context.previousCards.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error("Erro ao sincronizar tarefa");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto atualizado!");
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Projeto excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      columnId: string; 
      position: number;
      description?: string;
      priority?: string;
      weight?: number;
      dueDate?: string | null;
      tagIds?: string[];
      assigneeIds?: string[];
      parentId?: string;
      blockedByIds?: string[];
      blockingIds?: string[];
      relatedToIds?: string[];
      checklists?: { text: string; completed: boolean; position: number }[];
      customFieldValues?: { customFieldId: string; value: string }[];
    }) => {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["board"] });

      // Snapshot the previous board data for any active boards
      const previousBoards = queryClient.getQueriesData<Board>({ queryKey: ["board"] });

      // Construct the optimistic card object
      const optimisticCard: Card = {
        id: `temp-${Date.now()}`,
        title: newData.title,
        description: newData.description || undefined,
        position: newData.position || 0,
        priority: (newData.priority as any) || "Medium",
        weight: newData.weight || 1,
        columnId: newData.columnId,
        dueDate: newData.dueDate ? new Date(newData.dueDate) : null,
        tags: [],
        assignees: [],
        checklists: newData.checklists 
          ? newData.checklists.map((c, i) => ({ id: `temp-chk-${i}`, text: c.text, completed: c.completed, position: c.position, cardId: "" }))
          : [],
        customFieldValues: newData.customFieldValues
          ? newData.customFieldValues.map(v => ({ id: `temp-val-${v.customFieldId}`, value: v.value, customFieldId: v.customFieldId, cardId: "" }))
          : [],
        createdAt: new Date().toISOString(),
      };

      // Optimistically insert the new card into the correct column
      queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col) => {
            if (col.id === newData.columnId) {
              return {
                ...col,
                cards: [...col.cards, optimisticCard],
              };
            }
            return col;
          }),
        };
      });

      return { previousBoards };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous state on error
      if (context?.previousBoards) {
        context.previousBoards.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error("Erro ao criar tarefa");
    },
    onSuccess: (newRealCard) => {
      // Replace the optimistic card with the real card in the cache
      queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col) => {
            if (col.id === newRealCard.columnId) {
              return {
                ...col,
                cards: col.cards.map((c) => 
                  c.id.startsWith("temp-") && c.title === newRealCard.title ? newRealCard : c
                ),
              };
            }
            return col;
          }),
        };
      });
      toast.success("Tarefa criada com sucesso!");
    },
    onSettled: () => {
      // Refetch board and statistics in background to ensure absolute sync
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
    },
  });
}

export function useCard(cardId: string) {
  return useQuery<Card>({
    queryKey: ["card", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) throw new Error("Failed to fetch card");
      return res.json();
    },
    enabled: !!cardId,
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      parentId: string; 
      columnId: string;
      position: number;
    }) => {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["card", variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
      toast.success("Subtarefa criada!");
    }
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, dependencyId, type }: { cardId: string; dependencyId: string; type: 'blockedBy' | 'blocking' | 'relatedTo' }) => {
      const body: any = {};
      if (type === 'blockedBy') body.blockedByIds = [dependencyId];
      if (type === 'blocking') body.blockingIds = [dependencyId];
      if (type === 'relatedTo') body.relatedToIds = [dependencyId];

      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["card", variables.cardId] });
      toast.success("Relação adicionada!");
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
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete board");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Quadro excluído com sucesso!");
    }
  });
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) => {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Permissão atualizada!");
    }
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Membro removido!");
    }
  });
}

export function useUpdateBoardPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, userId, ...permissions }: { 
      boardId: string; 
      userId: string; 
      canView?: boolean; 
      canEditTasks?: boolean; 
      canMoveTasks?: boolean; 
      canManageBoard?: boolean; 
    }) => {
      const res = await fetch(`/api/boards/${boardId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...permissions }),
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Permissões atualizadas!");
    }
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; boardId: string; position: number; type?: string; color?: string }) => {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["card"] });
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
      queryClient.invalidateQueries({ queryKey: ["card"] });
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
      queryClient.invalidateQueries({ queryKey: ["card"] });
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
// Comment Hooks
export function useComments(cardId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!cardId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, text }: { cardId: string; text: string }) => {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.cardId] });
    }
  });
}
// Activity Hooks
export function useActivities(boardId: string) {
  return useQuery<Activity[]>({
    queryKey: ["activities", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/activities`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    enabled: !!boardId,
  });
}

export function useCardActivities(cardId: string) {
  return useQuery<Activity[]>({
    queryKey: ["card-activities", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/activities`);
      if (!res.ok) throw new Error("Failed to fetch card activities");
      return res.json();
    },
    enabled: !!cardId,
  });
}

export function useBoardStats(boardId: string) {
  return useQuery<BoardStats>({
    queryKey: ["board-stats", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/stats`);
      if (!res.ok) throw new Error("Failed to fetch board stats");
      return res.json();
    },
    enabled: !!boardId,
    refetchOnMount: "always",
    staleTime: 0,
  });
}

export function useFolders(projectId: string) {
  return useQuery<Folder[]>({
    queryKey: ["folders", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/folders?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; projectId: string }) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folders", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCustomFields(projectId: string) {
  return useQuery<CustomField[]>({
    queryKey: ["custom-fields", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/fields`);
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useUpdateCustomValue(cardId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { customFieldId: string; value: string }) => {
      if (!cardId) throw new Error("Card ID is required");
      const res = await fetch(`/api/cards/${cardId}/values`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-stats"] });
      if (cardId) {
        queryClient.invalidateQueries({ queryKey: ["card", cardId] });
      }
    },
  });
}

// --- Docs Hooks ---

export function useDocs(projectId?: string, boardId?: string) {
  return useQuery<any[]>({
    queryKey: ["docs", { projectId, boardId }],
    queryFn: async () => {
      const url = new URL("/api/docs", window.location.origin);
      if (projectId) url.searchParams.append("projectId", projectId);
      if (boardId) url.searchParams.append("boardId", boardId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch docs");
      return res.json();
    },
  });
}

export function useDoc(id: string) {
  return useQuery<any>({
    queryKey: ["doc", id],
    queryFn: async () => {
      const res = await fetch(`/api/docs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch doc");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create doc");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      toast.success("Documento criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar documento: " + error.message);
    }
  });
}

export function useUpdateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/docs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update doc");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.invalidateQueries({ queryKey: ["doc", data.id] });
    },
  });
}

export function useDeleteDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/docs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete doc");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      toast.success("Documento excluído!");
    },
  });
}

// --- Whiteboard Hooks ---

export function useWhiteboards(projectId?: string, boardId?: string) {
  return useQuery<any[]>({
    queryKey: ["whiteboards", { projectId, boardId }],
    queryFn: async () => {
      const url = new URL("/api/whiteboards", window.location.origin);
      if (projectId) url.searchParams.append("projectId", projectId);
      if (boardId) url.searchParams.append("boardId", boardId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch whiteboards");
      return res.json();
    },
  });
}

export function useWhiteboard(id: string) {
  return useQuery<any>({
    queryKey: ["whiteboard", id],
    queryFn: async () => {
      const res = await fetch(`/api/whiteboards/${id}`);
      if (!res.ok) throw new Error("Failed to fetch whiteboard");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateWhiteboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create whiteboard");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      toast.success("Whiteboard criado com sucesso!");
    },
  });
}

export function useUpdateWhiteboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/whiteboards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update whiteboard");
      return res.json();
    },
    onMutate: async ({ id, ...newData }) => {
      await queryClient.cancelQueries({ queryKey: ["whiteboard", id] });
      const previousWB = queryClient.getQueryData(["whiteboard", id]);
      
      if (previousWB) {
        queryClient.setQueryData(["whiteboard", id], (old: any) => ({
          ...old,
          ...newData
        }));
      }
      
      return { previousWB };
    },
    onError: (err, variables, context) => {
      if (context?.previousWB) {
        queryClient.setQueryData(["whiteboard", variables.id], context.previousWB);
      }
    },
    onSuccess: (data: any) => {
      console.log("Whiteboard updated on server:", data.id, "data length:", data.data.length);
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      // We don't necessarily need to invalidate the singular one if we did optimistic update,
      // but it's safer to keep it in sync with server.
      queryClient.invalidateQueries({ queryKey: ["whiteboard", data.id] });
    },
  });
}

export function useDeleteWhiteboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/whiteboards/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete whiteboard");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
      toast.success("Whiteboard excluído!");
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; password?: string }) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export interface ProjectStats {
  project: {
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    boardsCount: number;
    foldersCount: number;
    membersCount: number;
    tasksCount: number;
    completedTasksCount: number;
    pendingTasksCount: number;
  };
  boards: {
    id: string;
    title: string;
    description?: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  }[];
  members: {
    userId: string;
    role: string;
    user: User;
    tasksAssignedCount: number;
  }[];
  priorityDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  deadlineDistribution: { name: string; value: number }[];
  overdueTasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    boardId?: string;
    boardTitle?: string;
    assignees: User[];
  }[];
  upcomingTasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    boardId?: string;
    boardTitle?: string;
    assignees: User[];
  }[];
}

export function useProjectStats(projectId: string) {
  return useQuery<ProjectStats>({
    queryKey: ["project-stats", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/stats`);
      if (!res.ok) throw new Error("Failed to fetch project stats");
      return res.json();
    },
    enabled: !!projectId,
    refetchOnMount: "always",
    staleTime: 0,
  });
}


