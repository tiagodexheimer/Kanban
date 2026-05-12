import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tagIds, assigneeIds, dueDate, ...rest } = body;

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
      },
      include: {
        tags: true,
        assignees: true,
        checklists: true,
        comments: {
          include: { user: true }
        }
      }
    });

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
    
    await prisma.card.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
