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
    const { id } = await params;
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        tags: true,
        assignees: true,
        checklists: { orderBy: { position: "asc" } },
        comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
        subtasks: { include: { tags: true, assignees: true } },
        parent: true,
        blockedBy: true,
        blocking: true,
        relatedTo: true,
        relatesTo: true,
        customFieldValues: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error fetching card:", error);
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
    const userId = (session?.user as any)?.id;
    
    const oldCard = await prisma.card.findUnique({
      where: { id },
      include: { column: true }
    });

    if (!oldCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tagIds, assigneeIds, blockedByIds, blockingIds, relatedToIds, dueDate, ...rest } = body;

    const card = await prisma.card.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        tags: tagIds !== undefined ? {
          set: tagIds.map((tid: string) => ({ id: tid }))
        } : undefined,
        assignees: assigneeIds !== undefined ? {
          set: assigneeIds.map((uid: string) => ({ id: uid }))
        } : undefined,
        blockedBy: blockedByIds !== undefined ? {
          set: blockedByIds.map((bid: string) => ({ id: bid }))
        } : undefined,
        blocking: blockingIds !== undefined ? {
          set: blockingIds.map((bid: string) => ({ id: bid }))
        } : undefined,
        relatedTo: relatedToIds !== undefined ? {
          set: relatedToIds.map((rid: string) => ({ id: rid }))
        } : undefined,
      },
      include: {
        tags: true,
        assignees: true,
        checklists: true,
        blockedBy: true,
        blocking: true,
        relatedTo: true,
        subtasks: true,
        comments: {
          include: { user: true }
        }
      }
    });

    if (userId) {
      if (rest.columnId && rest.columnId !== oldCard.columnId) {
        const newColumn = await prisma.column.findUnique({ where: { id: rest.columnId } });
        await logActivity({
          type: "MOVE_CARD",
          description: `moveu "${card.title}" de "${oldCard.column.title}" para "${newColumn?.title}"`,
          userId,
          boardId: oldCard.column.boardId,
          cardId: card.id
        });
      } else {
        await logActivity({
          type: "UPDATE_CARD",
          description: `atualizou a tarefa "${card.title}"`,
          userId,
          boardId: oldCard.column.boardId,
          cardId: card.id
        });
      }
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error updating card:", error);
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
    const userId = (session?.user as any)?.id;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { column: true }
    });

    if (card && userId) {
      await logActivity({
        type: "DELETE_CARD",
        description: `excluiu a tarefa "${card.title}"`,
        userId,
        boardId: card.column.boardId
      });
    }
    
    await prisma.card.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
