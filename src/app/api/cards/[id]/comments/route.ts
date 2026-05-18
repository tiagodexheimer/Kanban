import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const comments = await prisma.comment.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { text } = body;

    if (!text) return NextResponse.json({ error: "Comment text is required" }, { status: 400 });

    const userId = (session.user as any).id;

    const comment = await prisma.comment.create({
      data: {
        text,
        cardId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Log Activity
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: true }
    });
    
    if (card && card.column) {
      await logActivity({
        type: "ADD_COMMENT",
        description: `comentou na tarefa "${card.title}"`,
        userId,
        boardId: card.column.boardId,
        cardId: card.id
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
