import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ConnectionStatus } from "@prisma/client";

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const querySchema = z.object({
  status: z.nativeEnum(ConnectionStatus).optional(),
});

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const params = await context.params;
    console.log("GET Connections - Raw params:", params);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate the userId
    const paramsResult = paramsSchema.safeParse({ userId: params.userId });
    if (!paramsResult.success) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { userId } = paramsResult.data;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ConnectionStatus | null;
    console.log("GET Connections - Status:", status);

    const queryResult = querySchema.safeParse({ status });
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid status parameter" },
        { status: 400 }
      );
    }

    // Base query conditions
    const where = {
      OR: [{ senderId: userId }, { receiverId: userId }],
      ...(status && { status }),
    };

    console.log("GET Connections - Query where:", where);

    // Fetch connections with user details
    const connections = await prisma.connection.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log("GET Connections - Found connections:", connections);

    // If status is PENDING, separate sent and received requests
    if (status === "PENDING") {
      const sent = connections.filter((conn) => conn.senderId === userId);
      const received = connections.filter((conn) => conn.receiverId === userId);
      return NextResponse.json({ sent, received });
    }

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
