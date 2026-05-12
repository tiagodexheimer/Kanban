import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activities = await prisma.activity.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching card activities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
