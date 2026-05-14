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

    const doc = await prisma.doc.findUnique({
      where: { id },
      include: {
        subDocs: true,
        owner: {
          select: { name: true, image: true }
        }
      }
    });

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error fetching doc:", error);
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
    const { title, content } = body;

    const doc = await prisma.doc.update({
      where: { id },
      data: {
        title,
        content,
      }
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error updating doc:", error);
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

    await prisma.doc.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting doc:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
