import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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
