import prisma from "./prisma";

export type ActivityType = 
  | "CREATE_CARD" 
  | "UPDATE_CARD" 
  | "MOVE_CARD" 
  | "DELETE_CARD" 
  | "ADD_COMMENT" 
  | "CREATE_COLUMN"
  | "INVITE_MEMBER";

interface LogActivityProps {
  type: ActivityType;
  description: string;
  userId: string;
  boardId: string;
  cardId?: string;
}

export async function logActivity({ type, description, userId, boardId, cardId }: LogActivityProps) {
  try {
    await prisma.activity.create({
      data: {
        type,
        description,
        userId,
        boardId,
        cardId
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
