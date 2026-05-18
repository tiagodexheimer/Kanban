import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { subDays, startOfDay, endOfDay, format, isWithinInterval, differenceInDays, eachDayOfInterval } from "date-fns";

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

    // 3. Burn-down Data (Dynamic range based on board history)
    const allCardsByCreation = allCards.length > 0 
      ? [...allCards].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      : [];
    
    const earliestTaskDate = allCardsByCreation.length > 0 
      ? allCardsByCreation[0].createdAt 
      : subDays(new Date(), 7);

    const maxDueDate = allCards.filter(c => c.dueDate).length > 0 
      ? new Date(Math.max(...allCards.filter(c => c.dueDate).map(c => new Date(c.dueDate!).getTime())))
      : subDays(new Date(), -7); 
    
    const startDate = startOfDay(earliestTaskDate);
    const endDate = endOfDay(maxDueDate > new Date() ? maxDueDate : subDays(new Date(), -7));
    
    const burnDownData: any[] = [];
    const productivityData: any[] = [];
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const totalDays = days.length - 1;
    
    const doneColumns = board.columns.filter(col => 
      col.type === "DONE" || 
      col.title.toLowerCase() === "done" || 
      col.title.toLowerCase() === "concluído" || 
      col.title.toLowerCase() === "concluido"
    );
    const doneColumnIds = doneColumns.map(col => col.id);

    days.forEach((date, i) => {
      const dayEnd = endOfDay(date);
      const dayStart = startOfDay(date);

      // Remaining tasks at the end of this day
      const totalCreatedUntilNow = allCards.filter(c => c.createdAt <= dayEnd).length;
      const totalDoneUntilNow = allCards.filter(c => 
        (c.columnId ? doneColumnIds.includes(c.columnId) : false) && 
        c.updatedAt <= dayEnd
      ).length;

      // Ideal line: Piecewise linear based on deadlines
      // We want to interpolate between (startDate, total) and each deadline point.
      const milestones = [
        { date: startDate.getTime(), remaining: allCards.length },
        ...allCards
          .filter(c => c.dueDate)
          .map(c => ({ date: endOfDay(new Date(c.dueDate!)).getTime(), id: c.id }))
          .sort((a, b) => a.date - b.date)
          .reduce((acc: { date: number; remaining: number }[], curr) => {
            // Group by date and subtract counts
            const last = acc[acc.length - 1];
            if (last && last.date === curr.date) {
              last.remaining -= 1;
            } else {
              acc.push({ date: curr.date, remaining: (last?.remaining ?? allCards.length) - 1 });
            }
            return acc;
          }, [])
      ];

      // Ensure it ends at 0 on the absolute end date
      const lastMilestone = milestones[milestones.length - 1];
      if (lastMilestone && lastMilestone.date < endDate.getTime()) {
        milestones.push({ date: endDate.getTime(), remaining: 0 });
      } else if (!lastMilestone) {
        milestones.push({ date: endDate.getTime(), remaining: 0 });
      }

      // Find the two milestones surrounding the current date and interpolate
      const nowTime = date.getTime();
      let idealRemaining = 0;
      
      for (let j = 0; j < milestones.length - 1; j++) {
        const m1 = milestones[j];
        const m2 = milestones[j+1];
        if (nowTime >= m1.date && nowTime <= m2.date) {
          const ratio = (nowTime - m1.date) / (m2.date - m1.date);
          idealRemaining = m1.remaining - (m1.remaining - m2.remaining) * ratio;
          break;
        } else if (nowTime > m2.date) {
          idealRemaining = m2.remaining;
        }
      }
      
      burnDownData.push({
        date: format(date, "dd/MM"),
        // Only show remaining tasks for days that have already passed or for today
        remaining: dayStart > new Date() ? null : Math.max(0, totalCreatedUntilNow - totalDoneUntilNow),
        ideal: Number(idealRemaining.toFixed(2))
      });

      // Productivity (only for past and today)
      if (dayStart <= new Date()) {
        const completedCount = allCards.filter(c => 
          (c.columnId ? doneColumnIds.includes(c.columnId) : false) && 
          c.updatedAt >= dayStart && 
          c.updatedAt <= dayEnd
        ).length;

        productivityData.push({
          date: format(date, "dd/MM"),
          completed: completedCount
        });
      }
    });

    const totalDoneTasks = allCards.filter(c => c.columnId ? doneColumnIds.includes(c.columnId) : false).length;

    return NextResponse.json({
      statusDistribution,
      priorityDistribution,
      burnDownData,
      productivityData,
      summary: {
        total: allCards.length,
        done: totalDoneTasks,
        pending: allCards.length - totalDoneTasks
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
