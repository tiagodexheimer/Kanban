import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Fetch the project including all direct boards, folders with their boards, and members
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boards: {
          include: {
            columns: {
              include: {
                cards: {
                  include: {
                    assignees: true
                  }
                }
              }
            }
          }
        },
        folders: {
          include: {
            boards: {
              include: {
                columns: {
                  include: {
                    cards: {
                      include: {
                        assignees: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        members: {
          include: {
            user: true
          }
        },
        owner: true
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isMember = project.members.some(m => m.userId === userId) || project.ownerId === userId;
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Collect all boards in the project
    const allBoards = [
      ...(project.boards || []),
      ...(project.folders?.flatMap(f => f.boards || []) || [])
    ];

    // Collect all cards/tasks across all boards
    const allCards = allBoards.flatMap(board => 
      board.columns.flatMap(col => col.cards)
    );

    // Calculate completed cards (where column is DONE / "concluído")
    const completedCards = allCards.filter(card => {
      const board = allBoards.find(b => b.columns.some(col => col.id === card.columnId));
      const col = board?.columns.find(col => col.id === card.columnId);
      return col?.type === "DONE" || col?.title.toLowerCase() === "done" || col?.title.toLowerCase() === "concluído" || col?.title.toLowerCase() === "concluido";
    });

    const pendingCards = allCards.length - completedCards.length;

    // Calculate boards data for dashboard
    const boardsData = allBoards.map(board => {
      const boardCards = board.columns.flatMap(col => col.cards);
      const boardDoneCards = boardCards.filter(card => {
        const col = board.columns.find(c => c.id === card.columnId);
        return col?.type === "DONE" || col?.title.toLowerCase() === "done" || col?.title.toLowerCase() === "concluído" || col?.title.toLowerCase() === "concluido";
      });
      return {
        id: board.id,
        title: board.title,
        description: board.description,
        totalTasks: boardCards.length,
        completedTasks: boardDoneCards.length,
        pendingTasks: boardCards.length - boardDoneCards.length
      };
    });

    // Calculate priority distribution
    const priorityDistribution = [
      { name: "Baixa", value: allCards.filter(c => c.priority === "Low").length },
      { name: "Média", value: allCards.filter(c => c.priority === "Medium").length },
      { name: "Alta", value: allCards.filter(c => c.priority === "High").length },
      { name: "Urgente", value: allCards.filter(c => c.priority === "Urgent").length },
    ];

    // Calculate status distribution
    const statusDistribution = [
      { name: "A Fazer", value: allCards.filter(card => {
        const board = allBoards.find(b => b.columns.some(col => col.id === card.columnId));
        const col = board?.columns.find(col => col.id === card.columnId);
        return col?.type === "TODO" || col?.title.toLowerCase() === "todo" || col?.title.toLowerCase() === "a fazer" || col?.title.toLowerCase() === "a iniciar";
      }).length },
      { name: "Em Progresso", value: allCards.filter(card => {
        const board = allBoards.find(b => b.columns.some(col => col.id === card.columnId));
        const col = board?.columns.find(col => col.id === card.columnId);
        return col?.type === "IN_PROGRESS" || col?.title.toLowerCase() === "in_progress" || col?.title.toLowerCase() === "em progresso" || col?.title.toLowerCase() === "fazendo";
      }).length },
      { name: "Concluído", value: completedCards.length }
    ];

    // Calculate task count per member
    const membersData = project.members.map(member => {
      const assignedTasksCount = allCards.filter(card => 
        card.assignees.some(a => a.id === member.userId)
      ).length;
      
      return {
        userId: member.userId,
        role: member.role,
        user: member.user,
        tasksAssignedCount: assignedTasksCount
      };
    });

    // If the owner is not explicitly a member, add them as Owner
    if (!membersData.some(m => m.userId === project.ownerId)) {
      const ownerTasksCount = allCards.filter(card => 
        card.assignees.some(a => a.id === project.ownerId)
      ).length;

      membersData.unshift({
        userId: project.ownerId,
        role: "OWNER",
        user: project.owner,
        tasksAssignedCount: ownerTasksCount
      });
    }

    // Calculate deadlines data (overdue and upcoming tasks that are not done)
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const activeCards = allCards.filter(card => {
      const board = allBoards.find(b => b.columns.some(col => col.id === card.columnId));
      const col = board?.columns.find(col => col.id === card.columnId);
      const isDone = col?.type === "DONE" || col?.title.toLowerCase() === "done" || col?.title.toLowerCase() === "concluído" || col?.title.toLowerCase() === "concluido";
      return !isDone;
    });

    const overdueTasks = activeCards.filter(card => 
      card.dueDate && new Date(card.dueDate) < now
    );

    const upcomingTasks = activeCards.filter(card => 
      card.dueDate && 
      new Date(card.dueDate) >= now && 
      new Date(card.dueDate) <= threeDaysFromNow
    );

    const onTrackTasks = activeCards.filter(card => 
      !card.dueDate || new Date(card.dueDate) > threeDaysFromNow
    );

    const deadlineDistribution = [
      { name: "Vencidas", value: overdueTasks.length },
      { name: "A Vencer (3d)", value: upcomingTasks.length },
      { name: "No Prazo", value: onTrackTasks.filter(c => c.dueDate).length },
    ];

    const overdueTasksDetails = overdueTasks.map(card => {
      const board = allBoards.find(b => b.columns.some(col => col.id === card.columnId));
      return {
        id: card.id,
        title: card.title,
        dueDate: card.dueDate,
        priority: card.priority,
        boardId: board?.id,
        boardTitle: board?.title,
        assignees: card.assignees
      };
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const upcomingTasksDetails = upcomingTasks.map(card => {
      const board = allBoards.find(b => b.columns.some(col => col.id === card.columnId));
      return {
        id: card.id,
        title: card.title,
        dueDate: card.dueDate,
        priority: card.priority,
        boardId: board?.id,
        boardTitle: board?.title,
        assignees: card.assignees
      };
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      stats: {
        boardsCount: allBoards.length,
        foldersCount: project.folders?.length || 0,
        membersCount: membersData.length,
        tasksCount: allCards.length,
        completedTasksCount: completedCards.length,
        pendingTasksCount: pendingCards
      },
      boards: boardsData,
      members: membersData,
      priorityDistribution,
      statusDistribution,
      deadlineDistribution,
      overdueTasks: overdueTasksDetails,
      upcomingTasks: upcomingTasksDetails
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
