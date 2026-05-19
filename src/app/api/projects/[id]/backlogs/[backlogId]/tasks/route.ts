import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; backlogId: string }> }
) {
  try {
    const { backlogId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      title, 
      description, 
      priority, 
      weight,
      dueDate, 
      tagIds, 
      assigneeIds, 
      parentId, 
      blockedByIds, 
      blockingIds, 
      relatedToIds, 
      checklists, 
      customFieldValues 
    } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const lastCard = await prisma.card.findFirst({
      where: { backlogId },
      orderBy: { position: "desc" }
    });
    const position = lastCard ? lastCard.position + 1 : 1;

    const task = await prisma.card.create({
      data: {
        title,
        description: description || null,
        priority: priority || "Medium",
        weight: weight !== undefined ? Number(weight) : 1,
        dueDate: dueDate ? new Date(dueDate) : null,
        backlogId,
        position,
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
        customFieldValues: customFieldValues ? {
          create: customFieldValues.map((item: any) => ({
            customFieldId: item.customFieldId,
            value: item.value
          }))
        } : undefined,
      },
      include: {
        tags: true,
        assignees: true,
        checklists: true,
        comments: true,
        customFieldValues: true
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating backlog task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
