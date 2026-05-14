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
        customFields: true,
        permissions: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true } }
          }
        },
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              where: { parentId: null },
              orderBy: { position: "asc" },
              include: {
                tags: true,
                assignees: true,
                customFieldValues: true,
                blockedBy: { select: { id: true } },
                subtasks: { select: { id: true } },
                parent: { select: { title: true } },
                comments: {
                  include: { user: true }
                },
                checklists: {
                  orderBy: { position: "asc" },
                },
              },
            },
          },
        },
        project: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, image: true, email: true } } }
            }
          }
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = board.ownerId === userId;
    const userPermission = board.permissions.find(p => p.userId === userId);
    const projectMember = board.project?.members.find(m => m.userId === userId);
    
    // Project roles that grant full board access
    const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";

    if (!isOwner && !isProjectAdmin && !userPermission?.canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Add user-specific permission info to the response
    const permissions = {
      canView: isOwner || isProjectAdmin || !!userPermission?.canView,
      canEditTasks: isOwner || isProjectAdmin || !!userPermission?.canEditTasks,
      canMoveTasks: isOwner || isProjectAdmin || !!userPermission?.canMoveTasks,
      canManageBoard: isOwner || isProjectAdmin || !!userPermission?.canManageBoard,
    };

    return NextResponse.json({ ...board, userPermissions: permissions });
  } catch (error) {
    console.error("Error fetching board:", error);
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
