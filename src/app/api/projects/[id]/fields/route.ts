import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isMember = project.ownerId === userId || project.members.some(m => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const fields = await prisma.customField.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(fields);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { name, type, options } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: "Name and Type are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const memberRecord = project.members.find(m => m.userId === userId);
    const isOwner = project.ownerId === userId;
    const canEdit = isOwner || (memberRecord && memberRecord.role !== "VIEWER");

    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const field = await prisma.customField.create({
      data: {
        name,
        type,
        options: options ? JSON.stringify(options) : null,
        projectId
      }
    });

    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
