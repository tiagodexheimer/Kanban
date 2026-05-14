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

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, image: true, email: true } } }
            }
          }
        },
        permissions: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true } }
          }
        }
      }
    });

    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    // Permission check (can user even see this?)
    const isOwner = board.ownerId === userId;
    const projectMember = board.project?.members.find(m => m.userId === userId);
    const userPermission = board.permissions.find(p => p.userId === userId);
    
    if (!isOwner && projectMember?.role !== "OWNER" && projectMember?.role !== "ADMIN" && !userPermission?.canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      projectMembers: board.project?.members || [],
      boardPermissions: board.permissions || []
    });
  } catch (error) {
    console.error("Error fetching board members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
