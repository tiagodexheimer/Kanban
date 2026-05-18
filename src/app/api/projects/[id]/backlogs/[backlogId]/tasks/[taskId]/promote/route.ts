import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; backlogId: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { boardId } = body;

    if (!boardId) return NextResponse.json({ error: "BoardId is required" }, { status: 400 });

    const userId = (session.user as any).id;

    // 1. Find the backlog task (which is a card)
    const backlogTask = await prisma.card.findUnique({
      where: { id: taskId }
    });

    if (!backlogTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // 2. Find columns of the destination board
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: true }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });
    if (board.columns.length === 0) return NextResponse.json({ error: "Board has no columns" }, { status: 400 });

    // Find the first column of type "TODO", or fallback to column with smallest position
    let todoColumn = board.columns.find(col => col.type === "TODO");
    if (!todoColumn) {
      todoColumn = board.columns.sort((a, b) => a.position - b.position)[0];
    }

    // 3. Find the maximum position of cards in this column to place at the end
    const lastCard = await prisma.card.findFirst({
      where: { columnId: todoColumn.id },
      orderBy: { position: "desc" }
    });
    const position = lastCard ? lastCard.position + 1 : 1;

    // 4. Update the existing Card
    const card = await prisma.card.update({
      where: { id: taskId },
      data: {
        columnId: todoColumn.id,
        backlogId: null,
        position
      }
    });

    // 5. Create activity logging for the board
    await prisma.activity.create({
      data: {
        type: "CARD_CREATE",
        description: `adicionou a tarefa "${card.title}" vinda do backlog`,
        userId,
        boardId: boardId,
        cardId: card.id
      }
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error promoting task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
