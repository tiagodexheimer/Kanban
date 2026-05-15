import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const boardId = searchParams.get("boardId");

    const userId = (session.user as any).id;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (boardId) where.boardId = boardId;
    if (!projectId && !boardId) {
      // If no context, return user's own docs
      where.ownerId = userId;
    }

    if (!prisma.doc) {
      console.error("Prisma Doc model is undefined!");
      return NextResponse.json({ error: "Prisma configuration error" }, { status: 500 });
    }

    const docs = await prisma.doc.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        subDocs: true,
      }
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error fetching docs:", error);
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

    const { title, content, projectId, boardId, parentId } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const userId = (session.user as any).id;
    console.log("Creating doc with data:", { title, ownerId: userId });

    if (!prisma.doc) {
      console.error("Prisma Doc model is undefined!");
      return NextResponse.json({ error: "Prisma configuration error" }, { status: 500 });
    }

    const doc = await prisma.doc.create({
      data: {
        title,
        content,
        projectId,
        boardId,
        parentId,
        ownerId: userId,
      }
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error creating doc:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
