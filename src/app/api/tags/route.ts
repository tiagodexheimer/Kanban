import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Creating tag with body:", body);
    const { name, color, boardId } = body;

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#7c3aed",
        boardId,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
