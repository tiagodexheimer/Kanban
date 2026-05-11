import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { completed, text } = body;

    const item = await prisma.checklistItem.update({
      where: { id },
      data: {
        completed: completed !== undefined ? completed : undefined,
        text: text !== undefined ? text : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.checklistItem.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
