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

    const backlogs = await prisma.backlog.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            assignees: true,
            tags: true,
            checklists: true,
            comments: true,
            customFieldValues: true
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(backlogs);
  } catch (error) {
    console.error("Error fetching backlogs:", error);
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

    const body = await request.json();
    const { title } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const backlog = await prisma.backlog.create({
      data: {
        title,
        projectId
      },
      include: {
        tasks: true
      }
    });

    return NextResponse.json(backlog, { status: 201 });
  } catch (error) {
    console.error("Error creating backlog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
