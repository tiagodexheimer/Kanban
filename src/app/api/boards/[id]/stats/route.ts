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

    // 3. Burn-down Data (Dynamic range based on due dates)
    const allCardsWithDates = allCards.filter(c => c.dueDate);
    const maxDueDate = allCardsWithDates.length > 0 
      ? new Date(Math.max(...allCardsWithDates.map(c => new Date(c.dueDate!).getTime())))
      : subDays(new Date(), -7); // Fallback to 7 days in future
    
    // We'll show from 7 days ago until the last due date (at least today + 7 days)
    const startDate = startOfDay(subDays(new Date(), 7));
    const endDate = endOfDay(maxDueDate > new Date() ? maxDueDate : subDays(new Date(), -7));
    
    const burnDownData = [];
    const productivityData = [];
    
    // Calculate total number of days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const doneColumn = board.columns.find(col => col.title.toLowerCase() === "done" || col.title.toLowerCase() === "concluído");

    for (let i = 0; i <= diffDays; i++) {
      const date = subDays(startDate, -i);
      const dayEnd = endOfDay(date);
      const dayStart = startOfDay(date);

      // Remaining tasks at the end of this day
      const totalCreatedUntilNow = allCards.filter(c => c.createdAt <= dayEnd).length;
      const totalDoneUntilNow = allCards.filter(c => 
        c.columnId === doneColumn?.id && 
        c.updatedAt <= dayEnd
      ).length;

      // Ideal line: A straight line from total tasks to zero
      const idealRemaining = Math.max(0, allCards.length - (allCards.length / diffDays) * i);
      
      burnDownData.push({
        date: format(date, "dd/MM"),
        remaining: dayEnd > new Date() ? null : Math.max(0, totalCreatedUntilNow - totalDoneUntilNow),
        ideal: Math.round(idealRemaining)
      });

      // Productivity (only for past and today)
      if (dayStart <= new Date()) {
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
