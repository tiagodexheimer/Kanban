import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { customFieldId, value } = await request.json();

    if (!customFieldId) {
      return NextResponse.json({ error: "customFieldId is required" }, { status: 400 });
    }

    const upsertValue = await prisma.customFieldValue.upsert({
      where: {
        cardId_customFieldId: {
          cardId,
          customFieldId
        }
      },
      update: { value },
      create: {
        cardId,
        customFieldId,
        value
      }
    });

    return NextResponse.json(upsertValue);
  } catch (error) {
    console.error("Error saving custom field value:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
