import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, columnId, position, description, priority, dueDate, tagIds } = body;

    const card = await prisma.card.create({
      data: {
        title,
        columnId,
        position: position || 0,
        description,
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: {
        tags: true,
        checklists: true,
      }
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
