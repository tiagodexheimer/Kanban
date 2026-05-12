import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { email } = body;

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const userId = (session.user as any).id;

    // Check if the current user is the owner or a member
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isMember = project.members.some(m => m.id === userId);
    const isOwner = project.ownerId === userId;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the user to invite
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToInvite) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
    }

    // Add user to project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userToInvite.id }
        }
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
