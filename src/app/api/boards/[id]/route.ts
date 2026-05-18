import prisma from "@/lib/prisma"; // Updated for Sprint 7
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        tags: true,
        owner: {
          select: { id: true, name: true, image: true }
        },
        permissions: {
          where: { userId },
          select: { canView: true, canEditTasks: true, canMoveTasks: true, canManageBoard: true }
        },
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              where: { parentId: null },
              orderBy: { position: "asc" },
              include: {
                tags: true,
                assignees: { select: { id: true, name: true, image: true } },
                customFieldValues: true,
                blockedBy: { select: { id: true } },
                subtasks: { select: { id: true } },
                parent: { select: { title: true } },
                checklists: { select: { id: true, completed: true } },
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            ownerId: true,
            customFields: true,
            members: {
              select: { 
                role: true,
                user: {
                  select: { id: true, name: true, image: true }
                }
              }
            }
          }
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Fetch all cards for mentions (including subtasks)
    const allCards = await prisma.card.findMany({
      where: { 
        column: { boardId: id } 
      },
      select: { 
        id: true, 
        title: true,
        parentId: true
      }
    });

    // Check permissions
    const isOwner = board.ownerId === userId || board.project?.ownerId === userId;
    const userPermission = board.permissions[0];
    const projectMember = board.project?.members.find((m: any) => m.user.id === userId);
    
    // Project roles and membership
    const isProjectMember = !!projectMember;
    const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";
    const isProjectRegularMember = projectMember?.role === "MEMBER";

    if (!isOwner && !isProjectAdmin && !isProjectMember && !userPermission?.canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Add user-specific permission info to the response
    const permissions = {
      canView: isOwner || isProjectAdmin || isProjectMember || !!userPermission?.canView,
      canEditTasks: isOwner || isProjectAdmin || isProjectRegularMember || !!userPermission?.canEditTasks,
      canMoveTasks: isOwner || isProjectAdmin || isProjectRegularMember || !!userPermission?.canMoveTasks,
      canManageBoard: isOwner || isProjectAdmin || !!userPermission?.canManageBoard,
    };

    return NextResponse.json({ 
      ...board, 
      customFields: board.project?.customFields || [], 
      allCards, 
      userPermissions: permissions 
    });
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: { where: { userId } }
          }
        },
        permissions: { where: { userId } }
      }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const isOwner = board.ownerId === userId;
    const projectMember = board.project?.members[0];
    const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";
    const canManageBoard = board.permissions[0]?.canManageBoard;

    if (!isOwner && !isProjectAdmin && !canManageBoard) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description } = await request.json();

    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updatedBoard = await prisma.board.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
      }
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: { where: { userId } }
          }
        },
        permissions: { where: { userId } }
      }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const isOwner = board.ownerId === userId;
    const projectMember = board.project?.members[0];
    const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";
    const canManageBoard = board.permissions[0]?.canManageBoard;

    if (!isOwner && !isProjectAdmin && !canManageBoard) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.board.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
