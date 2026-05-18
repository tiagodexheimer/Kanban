import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "./use-omnitask";

export type BacklogTask = Card;

export interface Backlog {
  id: string;
  title: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  tasks: BacklogTask[];
}

export function useBacklogs(projectId: string) {
  return useQuery<Backlog[]>({
    queryKey: ["backlogs", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/backlogs`);
      if (!res.ok) throw new Error("Failed to fetch backlogs");
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useCreateBacklog(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await fetch(`/api/projects/${projectId}/backlogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlogs", projectId] });
      toast.success("Backlog criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar backlog");
    }
  });
}

export function useDeleteBacklog(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (backlogId: string) => {
      await fetch(`/api/projects/${projectId}/backlogs/${backlogId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlogs", projectId] });
      toast.success("Backlog excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir backlog");
    }
  });
}

export function useCreateBacklogTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      backlogId: string; 
      title: string; 
      description?: string; 
      priority?: string; 
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
      const res = await fetch(`/api/projects/${projectId}/backlogs/${data.backlogId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlogs", projectId] });
      toast.success("Tarefa adicionada ao backlog!");
    },
    onError: () => {
      toast.error("Erro ao adicionar tarefa");
    }
  });
}

export function useDeleteBacklogTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { backlogId: string; taskId: string }) => {
      await fetch(`/api/projects/${projectId}/backlogs/${data.backlogId}/tasks/${data.taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlogs", projectId] });
      toast.success("Tarefa removida do backlog");
    },
    onError: () => {
      toast.error("Erro ao remover tarefa");
    }
  });
}

export function usePromoteBacklogTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { backlogId: string; taskId: string; boardId: string }) => {
      const res = await fetch(`/api/projects/${projectId}/backlogs/${data.backlogId}/tasks/${data.taskId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: data.boardId }),
      });
      if (!res.ok) throw new Error("Failed to promote task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlogs", projectId] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
      toast.success("Tarefa movida para o quadro com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao mover tarefa para o quadro");
    }
  });
}

export function useUpdateBacklog(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { backlogId: string; title: string }) => {
      const res = await fetch(`/api/projects/${projectId}/backlogs/${data.backlogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title }),
      });
      if (!res.ok) throw new Error("Failed to update backlog");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlogs", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
      toast.success("Backlog atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar backlog");
    }
  });
}
