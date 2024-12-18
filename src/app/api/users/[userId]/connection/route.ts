import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications";

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Get connection status
export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { userId } = paramsSchema.parse(params);

    // Find connection in either direction
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
    });

    return NextResponse.json(connection);
  } catch (error) {
    console.error("Error getting connection status:", error);
    return NextResponse.json(
      { error: "Failed to get connection status" },
      { status: 500 }
    );
  }
}

// Send connection request
export async function POST(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { userId } = paramsSchema.parse(params);

    // Check if users are the same
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: userId,
          },
          {
            senderId: userId,
            receiverId: session.user.id,
          },
        ],
      },
    });

    // If there's an existing connection and it's not rejected, return error
    if (existingConnection && existingConnection.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      );
    }

    // If there's a rejected connection, delete it
    if (existingConnection && existingConnection.status === "REJECTED") {
      await prisma.connection.delete({
        where: { id: existingConnection.id },
      });
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create connection request
      const connection = await tx.connection.create({
        data: {
          senderId: session.user.id,
          receiverId: userId,
          status: "PENDING",
        },
        include: {
          sender: {
            select: {
              name: true,
            },
          },
        },
      });

      // Send notification to the receiver
      await sendNotification({
        userId,
        type: "CONNECTION_REQUEST",
        message: `${connection.sender.name} sent you a connection request`,
      });

      return connection;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating connection:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}

// Accept/Reject connection request
export async function PATCH(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { userId } = paramsSchema.parse(params);
    const { action } = (await request.json()) as {
      action: "accept" | "reject";
    };

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const connection = await tx.connection.findFirst({
        where: {
          senderId: userId,
          receiverId: session.user.id,
          status: "PENDING",
        },
        include: {
          receiver: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!connection) {
        throw new Error("Connection request not found");
      }

      if (action === "accept") {
        const updatedConnection = await tx.connection.update({
          where: { id: connection.id },
          data: { status: "ACCEPTED" },
          include: {
            receiver: {
              select: {
                name: true,
              },
            },
          },
        });

        // Send notification to the sender that their request was accepted
        await sendNotification({
          userId: connection.senderId,
          type: "CONNECTION_ACCEPTED",
          message: `${connection.receiver.name} accepted your connection request`,
        });

        return updatedConnection;
      } else if (action === "reject") {
        return await tx.connection.update({
          where: { id: connection.id },
          data: { status: "REJECTED" },
        });
      }

      throw new Error("Invalid action");
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating connection:", error);
    if (error instanceof Error) {
      if (error.message === "Connection request not found") {
        return NextResponse.json(
          { error: "Connection request not found" },
          { status: 404 }
        );
      }
      if (error.message === "Invalid action") {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}

// Delete connection
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { connectionId } = body;

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Verify that the user is part of the connection
    if (
      connection.senderId !== session.user.id &&
      connection.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to delete this connection" },
        { status: 403 }
      );
    }

    await prisma.connection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
