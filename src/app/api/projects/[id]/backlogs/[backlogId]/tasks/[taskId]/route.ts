import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; backlogId: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.card.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting backlog task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
