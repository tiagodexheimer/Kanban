import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const body = await request.json();
    const { title, columnId, position, description, priority, dueDate, tagIds, assigneeIds, parentId, blockedByIds, blockingIds, relatedToIds, checklists } = body;

    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true }
    });

    const card = await prisma.card.create({
      data: {
        title,
        columnId,
        position: position || 0,
        description,
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        parentId,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
        assignees: assigneeIds ? {
          connect: assigneeIds.map((id: string) => ({ id }))
        } : undefined,
        blockedBy: blockedByIds ? {
          connect: blockedByIds.map((id: string) => ({ id }))
        } : undefined,
        blocking: blockingIds ? {
          connect: blockingIds.map((id: string) => ({ id }))
        } : undefined,
        relatedTo: relatedToIds ? {
          connect: relatedToIds.map((id: string) => ({ id }))
        } : undefined,
        checklists: checklists ? {
          create: checklists.map((item: any) => ({
            text: item.text,
            completed: item.completed || false,
            position: item.position || 0
          }))
        } : undefined,
      },
      include: {
        tags: true,
        assignees: true,
        checklists: true,
      }
    });

    if (userId && column?.boardId) {
      await logActivity({
        type: "CREATE_CARD",
        description: `criou a tarefa "${title}"`,
        userId,
        boardId: column.boardId,
        cardId: card.id
      });
    }

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
