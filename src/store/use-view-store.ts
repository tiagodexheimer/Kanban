import { create } from "zustand";

export type ViewType = "board" | "list" | "calendar" | "dashboard" | "docs";

export interface ViewFilters {
  search: string;
  priorities: string[];
  tags: string[];
}

export interface SortConfig {
  field: "title" | "priority" | "dueDate" | "createdAt";
  direction: "asc" | "desc";
}

interface ViewState {
  currentView: ViewType;
  filters: ViewFilters;
  sort: SortConfig;
  activeBoardId: string | null;
  setView: (view: ViewType) => void;
  setSearch: (search: string) => void;
  togglePriority: (priority: string) => void;
  toggleTag: (tagId: string) => void;
  setSort: (sort: SortConfig) => void;
  setActiveBoardId: (boardId: string | null) => void;
  resetFilters: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "board",
  filters: {
    search: "",
    priorities: [],
    tags: [],
  },
  sort: {
    field: "createdAt",
    direction: "desc",
  },
  activeBoardId: null,
  setView: (view) => set({ currentView: view }),
  setSearch: (search) => set((state) => ({ 
    filters: { ...state.filters, search } 
  })),
  togglePriority: (priority) => set((state) => ({
    filters: {
      ...state.filters,
      priorities: state.filters.priorities.includes(priority)
        ? state.filters.priorities.filter((p) => p !== priority)
        : [...state.filters.priorities, priority],
    },
  })),
  toggleTag: (tagId) => set((state) => ({
    filters: {
      ...state.filters,
      tags: state.filters.tags.includes(tagId)
        ? state.filters.tags.filter((t) => t !== tagId)
        : [...state.filters.tags, tagId],
    },
  })),
  setSort: (sort) => set({ sort }),
  setActiveBoardId: (boardId) => set({ activeBoardId: boardId }),
  resetFilters: () => set({
    filters: {
      search: "",
      priorities: [],
      tags: [],
    },
  }),
}));
