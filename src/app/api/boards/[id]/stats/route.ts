import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { subDays, startOfDay, endOfDay, format, isWithinInterval } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          include: {
            cards: true
          }
        }
      }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    // 1. Task Distribution by Status (Columns)
    const statusDistribution = board.columns.map(col => ({
      name: col.title,
      value: col.cards.length
    }));

    // 2. Task Distribution by Priority
    const allCards = board.columns.flatMap(col => col.cards);
    const priorityDistribution = [
      { name: "Baixa", value: allCards.filter(c => c.priority === "Low").length },
      { name: "Média", value: allCards.filter(c => c.priority === "Medium").length },
      { name: "Alta", value: allCards.filter(c => c.priority === "High").length },
      { name: "Urgente", value: allCards.filter(c => c.priority === "Urgent").length },
    ];

    // 3. Burn-down Data (Last 7 Days)
    const burnDownData = [];
    const doneColumn = board.columns.find(col => col.title.toLowerCase() === "done" || col.title.toLowerCase() === "concluído");
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Simple estimation: 
      // Tasks remaining = (Total cards created until dayEnd) - (Cards moved to Done until dayEnd)
      // Since we don't have full state history, we'll use a simplified version:
      // Current remaining tasks - tasks completed between then and now
      
      const totalCreatedUntilNow = allCards.filter(c => c.createdAt <= dayEnd).length;
      const totalDoneUntilNow = allCards.filter(c => 
        c.columnId === doneColumn?.id && 
        c.updatedAt <= dayEnd
      ).length;

      burnDownData.push({
        date: format(date, "dd/MM"),
        remaining: Math.max(0, totalCreatedUntilNow - totalDoneUntilNow),
        ideal: Math.max(0, allCards.length - (allCards.length / 7) * (7 - i)) // Ideal line
      });
    }

    // 4. Productivity (Tasks completed per day)
    const productivityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const completedCount = allCards.filter(c => 
        c.columnId === doneColumn?.id && 
        c.updatedAt >= dayStart && 
        c.updatedAt <= dayEnd
      ).length;

      productivityData.push({
        date: format(date, "dd/MM"),
        completed: completedCount
      });
    }

    return NextResponse.json({
      statusDistribution,
      priorityDistribution,
      burnDownData,
      productivityData,
      summary: {
        total: allCards.length,
        done: doneColumn?.cards.length || 0,
        pending: allCards.length - (doneColumn?.cards.length || 0)
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
