import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET: Fetch time tracking details and history for a card
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Fetch all logs for the card
    const logs = await prisma.timeLog.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Check if there is an active timer for the current user
    const activeTimer = logs.find(log => log.userId === userId && log.endTime === null);

    // Sum completed time logs (duration is stored in seconds)
    const completedDuration = logs
      .filter(log => log.endTime !== null)
      .reduce((sum, log) => sum + (log.duration || 0), 0);

    return NextResponse.json({
      logs,
      activeTimer: activeTimer ? {
        id: activeTimer.id,
        startTime: activeTimer.startTime
      } : null,
      totalDuration: completedDuration
    });
  } catch (error) {
    console.error("Error fetching card time logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Manage timer actions (start, stop, manual log)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await request.json();
    const { action } = body;

    // Retrieve card for activity logging
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { 
        column: true,
        backlog: true 
      }
    });

    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    const boardId = card.column?.boardId || null;

    if (action === "start") {
      // 1. Check if user already has an active timer on ANY card, and stop it
      const activeTimer = await prisma.timeLog.findFirst({
        where: { userId, endTime: null }
      });

      if (activeTimer) {
        const stopTime = new Date();
        const duration = Math.round((stopTime.getTime() - activeTimer.startTime.getTime()) / 1000);
        await prisma.timeLog.update({
          where: { id: activeTimer.id },
          data: {
            endTime: stopTime,
            duration: duration > 0 ? duration : 0
          }
        });
      }

      // 2. Start new timer
      const newTimer = await prisma.timeLog.create({
        data: {
          cardId,
          userId,
          startTime: new Date()
        }
      });

      // 3. Log activity
      if (boardId) {
        await logActivity({
          type: "START_TIMER",
          description: `iniciou o cronômetro para a tarefa "${card.title}"`,
          userId,
          boardId,
          cardId: card.id
        });
      }

      return NextResponse.json(newTimer, { status: 201 });

    } else if (action === "stop") {
      // Find the active timer on this card
      const activeTimer = await prisma.timeLog.findFirst({
        where: { cardId, userId, endTime: null }
      });

      if (!activeTimer) {
        return NextResponse.json({ error: "No active timer found on this card" }, { status: 400 });
      }

      const stopTime = new Date();
      const duration = Math.round((stopTime.getTime() - activeTimer.startTime.getTime()) / 1000);

      const stoppedTimer = await prisma.timeLog.update({
        where: { id: activeTimer.id },
        data: {
          endTime: stopTime,
          duration: duration > 0 ? duration : 0
        }
      });

      // Log activity
      if (boardId) {
        const minutes = Math.round((duration > 0 ? duration : 0) / 60);
        await logActivity({
          type: "STOP_TIMER",
          description: `pausou o cronômetro na tarefa "${card.title}" (registrou ${minutes} min)`,
          userId,
          boardId,
          cardId: card.id
        });
      }

      return NextResponse.json(stoppedTimer);

    } else if (action === "log") {
      const { duration, notes, date } = body;
      if (!duration || isNaN(duration)) {
        return NextResponse.json({ error: "Valid duration in seconds is required" }, { status: 400 });
      }

      const logDate = date ? new Date(date) : new Date();

      const manualLog = await prisma.timeLog.create({
        data: {
          cardId,
          userId,
          startTime: logDate,
          endTime: logDate,
          duration: parseInt(duration),
          notes
        }
      });

      // Log activity
      if (boardId) {
        const minutes = Math.round(parseInt(duration) / 60);
        await logActivity({
          type: "LOG_TIME",
          description: `registrou manualmente ${minutes} minutos na tarefa "${card.title}"`,
          userId,
          boardId,
          cardId: card.id
        });
      }

      return NextResponse.json(manualLog, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing timer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
