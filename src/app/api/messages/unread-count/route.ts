import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First check if the Message model exists in the database
    const messageCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "message"
      WHERE "receiverId" = ${session.user.id}
      AND "read" = false
    `;

    return NextResponse.json({ count: Number(messageCount[0].count) });
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return NextResponse.json({ count: 0 });
  }
}
