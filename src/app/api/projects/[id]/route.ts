import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        boards: true,
        folders: { include: { boards: true } },
        members: { include: { user: true } },
        owner: true
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isMember = project.members.some(m => m.userId === userId) || project.ownerId === userId;
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await request.json();

    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: { where: { userId } } }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isOwner = project.ownerId === userId;
    const isAdmin = project.members[0]?.role === "ADMIN";

    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updatedProject = await prisma.project.update({
      where: { id },
      data: body,
      include: { members: { include: { user: true } } }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can delete the project" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
