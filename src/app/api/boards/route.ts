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
          { members: { some: { id: userId } } },
          { project: { members: { some: { id: userId } } } }
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

