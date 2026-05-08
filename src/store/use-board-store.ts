import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Card {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  tags: string[];
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface BoardState {
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  columnOrder: string[];
  moveCard: (cardId: string, sourceColId: string, destColId: string, index: number) => void;
  addCard: (columnId: string, title: string) => void;
  updateCard: (cardId: string, data: Partial<Card>) => void;
  deleteCard: (cardId: string, columnId: string) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  cards: {
    "card-1": { id: "card-1", title: "Configurar Projeto", priority: "High", tags: ["Setup"] },
    "card-2": { id: "card-2", title: "Criar Layout Base", priority: "Medium", tags: ["UI"] },
    "card-3": { id: "card-3", title: "Integrar DND", priority: "High", tags: ["Feat"] },
  },
  columns: {
    "col-1": { id: "col-1", title: "To Do", cardIds: ["card-1", "card-2"] },
    "col-2": { id: "col-2", title: "In Progress", cardIds: ["card-3"] },
    "col-3": { id: "col-3", title: "Done", cardIds: [] },
  },
  columnOrder: ["col-1", "col-2", "col-3"],

  moveCard: (cardId, sourceColId, destColId, index) => set((state) => {
    const sourceCol = state.columns[sourceColId];
    const destCol = state.columns[destColId];
    
    const newSourceCardIds = sourceCol.cardIds.filter(id => id !== cardId);
    
    if (sourceColId === destColId) {
      newSourceCardIds.splice(index, 0, cardId);
      return {
        columns: {
          ...state.columns,
          [sourceColId]: { ...sourceCol, cardIds: newSourceCardIds }
        }
      };
    }

    const newDestCardIds = [...destCol.cardIds];
    newDestCardIds.splice(index, 0, cardId);

    return {
      columns: {
        ...state.columns,
        [sourceColId]: { ...sourceCol, cardIds: newSourceCardIds },
        [destColId]: { ...destCol, cardIds: newDestCardIds }
      }
    };
  }),

  addCard: (columnId, title) => set((state) => {
    const id = uuidv4();
    const newCard: Card = { id, title, priority: "Medium", tags: [] };
    
    return {
      cards: { ...state.cards, [id]: newCard },
      columns: {
        ...state.columns,
        [columnId]: {
          ...state.columns[columnId],
          cardIds: [...state.columns[columnId].cardIds, id]
        }
      }
    };
  }),

  updateCard: (cardId, data) => set((state) => ({
    cards: {
      ...state.cards,
      [cardId]: { ...state.cards[cardId], ...data }
    }
  })),

  deleteCard: (cardId, columnId) => set((state) => {
    const newCards = { ...state.cards };
    delete newCards[cardId];

    return {
      cards: newCards,
      columns: {
        ...state.columns,
        [columnId]: {
          ...state.columns[columnId],
          cardIds: state.columns[columnId].cardIds.filter(id => id !== cardId)
        }
      }
    };
  })
}));
