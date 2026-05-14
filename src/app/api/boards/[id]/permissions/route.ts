import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserId = (session.user as any).id;
    const body = await request.json();
    const { userId, ...permissions } = body;

    // Check if current user has permission to manage this board
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          include: {
            members: { where: { userId: currentUserId } }
          }
        },
        permissions: { where: { userId: currentUserId } }
      }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const isOwner = board.ownerId === currentUserId;
    const projectMember = board.project?.members[0];
    const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";
    const canManageBoard = board.permissions[0]?.canManageBoard;

    if (!isOwner && !isProjectAdmin && !canManageBoard) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update or create permissions for the target user
    const updatedPermission = await prisma.boardPermission.upsert({
      where: {
        boardId_userId: {
          boardId,
          userId
        }
      },
      update: permissions,
      create: {
        boardId,
        userId,
        ...permissions
      }
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error("Error updating board permissions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
