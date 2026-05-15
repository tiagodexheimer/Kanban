import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const boardId = searchParams.get("boardId");

    const where: any = { ownerId: session.user.id };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (boardId) {
      where.boardId = boardId;
    }

    // If we specifically want standalone whiteboards (not linked to project or board)
    if (searchParams.get("standalone") === "true") {
      where.projectId = null;
      where.boardId = null;
    }

    if (!prisma.whiteboard) {
      console.error("Prisma Whiteboard model is undefined!");
      return NextResponse.json({ error: "Prisma configuration error" }, { status: 500 });
    }

    const whiteboards = await prisma.whiteboard.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(whiteboards);
  } catch (error) {
    console.error("Error fetching whiteboards:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, data, projectId, boardId } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const whiteboard = await prisma.whiteboard.create({
      data: {
        title,
        data: data || "{}",
        projectId,
        boardId,
        ownerId: session.user.id,
      }
    });

    return NextResponse.json(whiteboard);
  } catch (error) {
    console.error("Error creating whiteboard:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
