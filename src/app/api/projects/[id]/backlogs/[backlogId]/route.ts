import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; backlogId: string }> }
) {
  try {
    const { backlogId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.backlog.delete({
      where: { id: backlogId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting backlog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; backlogId: string }> }
) {
  try {
    const { backlogId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const backlog = await prisma.backlog.update({
      where: { id: backlogId },
      data: { title: title.trim() }
    });

    return NextResponse.json(backlog);
  } catch (error) {
    console.error("Error updating backlog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
