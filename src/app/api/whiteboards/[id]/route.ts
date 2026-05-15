import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id },
      include: {
        owner: {
          select: { name: true, image: true }
        }
      }
    });

    if (!whiteboard) {
      console.warn("Whiteboard not found in DB:", id);
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }
    
    const dataSize = whiteboard.data?.length || 0;
    console.log(`[API] Fetched whiteboard ${id}:`, {
      title: whiteboard.title,
      dataLength: dataSize,
      updatedAt: whiteboard.updatedAt
    });

    return NextResponse.json(whiteboard);
  } catch (error) {
    console.error("Error fetching whiteboard:", error);
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

    const body = await request.json();
    const { title, data } = body;
    
    console.log(`[API] Updating whiteboard ${id}:`, {
      hasTitle: !!title,
      dataLength: data?.length || 0,
      timestamp: new Date().toISOString()
    });

    const whiteboard = await prisma.whiteboard.update({
      where: { id },
      data: {
        title,
        data,
      }
    });

    return NextResponse.json(whiteboard);
  } catch (error) {
    console.error("Error updating whiteboard:", error);
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

    await prisma.whiteboard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting whiteboard:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
