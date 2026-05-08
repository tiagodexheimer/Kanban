import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, cardId, position } = body;

    const item = await prisma.checklistItem.create({
      data: {
        text,
        cardId,
        position: position || 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
