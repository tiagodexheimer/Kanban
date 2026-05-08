import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, boardId, position } = body;

    const column = await prisma.column.create({
      data: {
        title,
        boardId,
        position: position || 0,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
