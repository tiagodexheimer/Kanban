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
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { position: "asc" },
              include: {
                tags: true,
                assignees: true,
                customFieldValues: true,
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
        members: true,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if user is owner or member (direct or via project)
    const isOwner = board.ownerId === userId;
    const isMember = board.members.some(m => m.id === userId);
    
    // Check project members if board is in a project
    let isProjectMember = false;
    if (board.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: board.projectId },
        include: { members: true }
      });
      isProjectMember = project?.members.some(m => m.id === userId) || project?.ownerId === userId;
    }

    if (!isOwner && !isMember && !isProjectMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
