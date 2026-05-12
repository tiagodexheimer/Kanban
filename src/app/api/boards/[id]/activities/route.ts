import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activities = await prisma.activity.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        card: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit to last 50 activities
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
