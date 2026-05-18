import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id: projectId, fieldId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const memberRecord = project.members.find(m => m.userId === userId);
    const isOwner = project.ownerId === userId;
    const canEdit = isOwner || (memberRecord && memberRecord.role !== "VIEWER");

    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.customField.delete({
      where: { id: fieldId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
