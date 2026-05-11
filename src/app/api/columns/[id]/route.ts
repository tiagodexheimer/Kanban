import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const column = await prisma.column.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.column.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
