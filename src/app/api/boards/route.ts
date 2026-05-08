import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
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
    const body = await request.json();
    const { title, description } = body;

    const board = await prisma.board.create({
      data: {
        title,
        description,
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
