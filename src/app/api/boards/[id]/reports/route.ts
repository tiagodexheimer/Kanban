import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        columns: {
          include: {
            cards: {
              include: {
                assignees: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                },
                timeLogs: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true
                      }
                    }
                  }
                },
                checklists: true
              }
            }
          }
        }
      }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const doneColumns = board.columns.filter(col => 
      col.type === "DONE" || 
      col.title.toLowerCase() === "done" || 
      col.title.toLowerCase() === "concluído" || 
      col.title.toLowerCase() === "concluido"
    );
    const doneColumnIds = doneColumns.map(col => col.id);

    // 1. Process all tasks/cards on this board
    const allCards = board.columns.flatMap(col => 
      col.cards.map(card => {
        const totalDuration = card.timeLogs
          .filter(log => log.endTime !== null)
          .reduce((sum, log) => sum + (log.duration || 0), 0);

        const hasActiveTimer = card.timeLogs.some(log => log.endTime === null);

        const completedChecklistItems = card.checklists.filter(i => i.completed).length;
        const totalChecklistItems = card.checklists.length;

        return {
          id: card.id,
          title: card.title,
          priority: card.priority,
          dueDate: card.dueDate,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          columnId: card.columnId,
          columnTitle: col.title,
          columnType: col.type,
          isCompleted: card.columnId ? doneColumnIds.includes(card.columnId) : false,
          assignees: card.assignees,
          weight: card.weight !== undefined ? card.weight : 1,
          totalDuration, // in seconds
          hasActiveTimer,
          checklistProgress: totalChecklistItems > 0 
            ? `${completedChecklistItems}/${totalChecklistItems}` 
            : null
        };
      })
    );

    // 2. Fetch Board/Project Members and calculate their workload
    // Get members from project, or default to all users who are assignees on this board
    const projectMembers = board.project?.members.map(m => m.user) || [];
    
    // Supplement with any users that are assigned to tasks but might not be explicitly listed in project members
    const allAssignees = allCards.flatMap(c => c.assignees);
    const uniqueAssigneeIds = Array.from(new Set(allAssignees.map(a => a.id)));
    
    const membersList = [...projectMembers];
    uniqueAssigneeIds.forEach(id => {
      if (!membersList.some(m => m.id === id)) {
        const found = allAssignees.find(a => a.id === id);
        if (found) {
          membersList.push({
            id: found.id,
            name: found.name,
            image: found.image,
            email: null
          });
        }
      }
    });

    const membersWorkload = membersList.map(member => {
      const assignedTasks = allCards.filter(card => 
        card.assignees.some(a => a.id === member.id)
      );
      
      const pendingTasks = assignedTasks.filter(card => !card.isCompleted);
      const completedTasks = assignedTasks.filter(card => card.isCompleted);

      const totalWeight = assignedTasks.reduce((sum, card) => sum + (card.weight || 0), 0);
      const pendingWeight = pendingTasks.reduce((sum, card) => sum + (card.weight || 0), 0);
      const completedWeight = completedTasks.reduce((sum, card) => sum + (card.weight || 0), 0);

      // Sum duration of time logs tracked by this user *on this board*
      let totalSecondsLogged = 0;
      board.columns.forEach(col => {
        col.cards.forEach(card => {
          card.timeLogs.forEach(log => {
            if (log.userId === member.id && log.endTime !== null) {
              totalSecondsLogged += (log.duration || 0);
            }
          });
        });
      });

      // Workload Status: Verde (<3 active tasks ou < 8 SP), Amarelo (3-5 tarefas ou 8-15 SP), Vermelho (>5 tarefas ou > 15 SP)
      let workloadStatus: "GREEN" | "AMBER" | "RED" = "GREEN";
      if (pendingTasks.length > 5 || pendingWeight > 15) {
        workloadStatus = "RED";
      } else if (pendingTasks.length >= 3 || pendingWeight >= 8) {
        workloadStatus = "AMBER";
      }

      return {
        id: member.id,
        name: member.name || member.email || "Membro",
        image: member.image,
        totalTasks: assignedTasks.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        totalWeight,
        pendingWeight,
        completedWeight,
        workloadStatus,
        totalTimeLogged: totalSecondsLogged
      };
    });

    // 3. Overall Summary
    const totalTimeLoggedAll = allCards.reduce((sum, c) => sum + c.totalDuration, 0);
    const completedTasksCount = allCards.filter(c => c.isCompleted).length;
    const totalWeightAll = allCards.reduce((sum, c) => sum + (c.weight || 0), 0);
    const completedWeightAll = allCards.filter(c => c.isCompleted).reduce((sum, c) => sum + (c.weight || 0), 0);

    return NextResponse.json({
      cards: allCards,
      members: membersWorkload,
      summary: {
        totalTasks: allCards.length,
        completedTasks: completedTasksCount,
        pendingTasks: allCards.length - completedTasksCount,
        totalWeight: totalWeightAll,
        completedWeight: completedWeightAll,
        pendingWeight: totalWeightAll - completedWeightAll,
        totalTimeLogged: totalTimeLoggedAll, // in seconds
        averageTimePerTask: completedTasksCount > 0 
          ? Math.round(totalTimeLoggedAll / completedTasksCount) 
          : 0
      }
    });
  } catch (error) {
    console.error("Error fetching board reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
