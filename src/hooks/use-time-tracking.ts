import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface TimeLog {
  id: string;
  cardId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
  };
}

export interface CardTimeData {
  logs: TimeLog[];
  activeTimer: {
    id: string;
    startTime: string;
  } | null;
  totalDuration: number; // in seconds
}

export interface BoardReportData {
  cards: {
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
    columnTitle: string;
    columnType: string;
    isCompleted: boolean;
    assignees: { id: string; name: string | null; image: string | null }[];
    totalDuration: number;
    hasActiveTimer: boolean;
    checklistProgress: string | null;
    weight: number;
  }[];
  members: {
    id: string;
    name: string;
    image: string | null;
    totalTasks: number;
    pendingTasksCount: number;
    completedTasksCount: number;
    totalWeight: number;
    pendingWeight: number;
    completedWeight: number;
    workloadStatus: "GREEN" | "AMBER" | "RED";
    totalTimeLogged: number;
  }[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalWeight: number;
    completedWeight: number;
    pendingWeight: number;
    totalTimeLogged: number;
    averageTimePerTask: number;
  };
}

export function useCardTime(cardId: string) {
  return useQuery<CardTimeData>({
    queryKey: ["card-time", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/time`);
      if (!res.ok) throw new Error("Failed to fetch card time logs");
      return res.json();
    },
    enabled: !!cardId,
  });
}

export function useStartTimer(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error("Failed to start timer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-time", cardId] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-reports"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast.success("Cronômetro iniciado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao iniciar cronômetro");
    }
  });
}

export function useStopTimer(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      if (!res.ok) throw new Error("Failed to stop timer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-time", cardId] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-reports"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast.success("Cronômetro pausado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao pausar cronômetro");
    }
  });
}

export function useLogTime(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { duration: number; notes?: string; date?: string }) => {
      const res = await fetch(`/api/cards/${cardId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "log", ...data }),
      });
      if (!res.ok) throw new Error("Failed to log time");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-time", cardId] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-reports"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast.success("Tempo registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar tempo");
    }
  });
}

export function useDeleteTimeLog(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      const res = await fetch(`/api/time-logs/${logId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete time log");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-time", cardId] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["board-reports"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast.success("Registro de tempo removido!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover registro de tempo");
    }
  });
}

export function useBoardReports(boardId: string) {
  return useQuery<BoardReportData>({
    queryKey: ["board-reports", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/reports`);
      if (!res.ok) throw new Error("Failed to fetch board reports");
      return res.json();
    },
    enabled: !!boardId,
  });
}
