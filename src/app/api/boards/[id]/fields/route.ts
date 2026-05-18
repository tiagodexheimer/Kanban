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
      select: { projectId: true }
    });
    if (!board || !board.projectId) return NextResponse.json([]);

    const fields = await prisma.customField.findMany({
      where: { projectId: board.projectId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(fields);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, type, options } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: "Name and Type are required" }, { status: 400 });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { projectId: true }
    });
    if (!board || !board.projectId) {
      return NextResponse.json({ error: "Board has no project" }, { status: 400 });
    }

    const field = await prisma.customField.create({
      data: {
        name,
        type,
        options: options ? JSON.stringify(options) : null,
        projectId: board.projectId
      }
    });

    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
