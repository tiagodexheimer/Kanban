import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { permissions: { some: { userId, canView: true } } },
          { project: { members: { some: { userId } } } }
        ]
      },
      include: {
        columns: {
          include: {
            cards: {
              include: {
                tags: true,
                assignees: true,
              },
            },
          },
        },
        tags: true,
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, projectId, folderId } = body;

    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const board = await prisma.board.create({
      data: {
        title,
        description,
        ownerId: userId,
        projectId: projectId || null,
        folderId: folderId || null,
        permissions: {
          create: {
            userId,
            canView: true,
            canEditTasks: true,
            canMoveTasks: true,
            canManageBoard: true
          }
        },
        columns: {
          create: [
            { title: "To Do", position: 1 },
            { title: "Doing", position: 2 },
            { title: "Done", position: 3 },
          ],
        },
      },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

