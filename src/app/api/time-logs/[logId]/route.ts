import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Find the log entry first
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: logId },
      include: {
        card: {
          include: {
            column: true
          }
        }
      }
    });

    if (!timeLog) {
      return NextResponse.json({ error: "Time log not found" }, { status: 404 });
    }

    // Verify user role or if the user is the one who logged it
    const isOwner = timeLog.userId === userId;
    
    // Allow if it is the owner of the log, or if there's no strict rule
    if (!isOwner) {
      // In projects, admins/owners can delete anything, but we keep it simple: allow the logger to delete it.
      // We can also check board permission if needed, but let's allow log author.
      return NextResponse.json({ error: "You can only delete your own time logs" }, { status: 403 });
    }

    await prisma.timeLog.delete({
      where: { id: logId }
    });

    // Log Activity
    const boardId = timeLog.card.column?.boardId || null;
    if (boardId) {
      const minutes = Math.round((timeLog.duration || 0) / 60);
      await logActivity({
        type: "DELETE_TIME_LOG",
        description: `removeu um registro de tempo (${minutes} min) da tarefa "${timeLog.card.title}"`,
        userId,
        boardId,
        cardId: timeLog.card.id
      });
    }

    return NextResponse.json({ message: "Time log deleted successfully" });
  } catch (error) {
    console.error("Error deleting time log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
