import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ConnectionStatus } from "@prisma/client";

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const actionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

// Get connection status
export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const params = await context.params;
    console.log("GET Connection - Raw params:", params);
    console.log("GET Connection - userId:", params.userId);

    const session = await getServerSession(authOptions);
    console.log("GET Connection - Session:", {
      userId: session?.user?.id,
      isAuthenticated: !!session?.user,
    });

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate the userId
    const result = paramsSchema.safeParse({ userId: params.userId });
    console.log("GET Connection - Validation result:", {
      success: result.success,
      errors: !result.success ? result.error.errors : null,
    });

    if (!result.success) {
      console.error("Invalid params:", result.error.errors);
      return NextResponse.json(
        { error: "Invalid user ID", details: result.error.errors },
        { status: 400 }
      );
    }

    const { userId } = result.data;
    console.log("GET Connection - Validated userId:", userId);

    // Find connection in either direction
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
    });

    console.log("GET Connection - Found connection:", connection);
    if (!connection) {
      return NextResponse.json(null);
    }

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
    const params = await context.params;
    console.log("POST Connection - Raw params:", params);
    console.log("POST Connection - userId:", params.userId);

    const session = await getServerSession(authOptions);
    console.log("POST Connection - Session:", {
      userId: session?.user?.id,
      isAuthenticated: !!session?.user,
    });

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate the userId
    const result = paramsSchema.safeParse({ userId: params.userId });
    console.log("POST Connection - Validation result:", {
      success: result.success,
      errors: !result.success ? result.error.errors : null,
    });

    if (!result.success) {
      console.error("Invalid params:", result.error.errors);
      return NextResponse.json(
        { error: "Invalid user ID", details: result.error.errors },
        { status: 400 }
      );
    }

    const { userId } = result.data;
    console.log("POST Connection - Validated userId:", userId);

    // Prevent self-connection
    if (session.user.id === userId) {
      console.log("POST Connection - Attempted self-connection");
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
    });

    console.log("POST Connection - Existing connection:", existingConnection);

    if (existingConnection) {
      // If there's a rejected connection, delete it and allow a new request
      if (existingConnection.status === "REJECTED") {
        await prisma.connection.delete({
          where: { id: existingConnection.id },
        });
      } else {
        return NextResponse.json(
          { error: "Connection already exists" },
          { status: 400 }
        );
      }
    }

    // Create new connection request
    const connection = await prisma.connection.create({
      data: {
        senderId: session.user.id,
        receiverId: userId,
        status: "PENDING",
      },
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
    });

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: userId,
        type: "CONNECTION_REQUEST",
        message: `${session.user.name} sent you a connection request`,
        read: false,
      },
    });

    console.log("POST Connection - Created connection:", connection);
    return NextResponse.json(connection);
  } catch (error) {
    console.error("Error creating connection:", error);
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
    const params = await context.params;
    console.log("PATCH Connection - Raw params:", params);

    const session = await getServerSession(authOptions);
    console.log("PATCH Connection - Session user:", session?.user);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const paramsResult = paramsSchema.safeParse({ userId: params.userId });
    if (!paramsResult.success) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { userId } = paramsResult.data;

    // Prevent self-connections
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot accept/reject your own connection" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("PATCH Connection - Request body:", body);

    const actionResult = actionSchema.safeParse(body);
    if (!actionResult.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { action } = actionResult.data;

    // Find pending connection where current user is the receiver and the other user is the sender
    console.log("PATCH Connection - Searching for connection with:", {
      senderId: userId,
      receiverId: session.user.id,
      status: "PENDING",
    });

    // First check if there's any connection at all between these users
    const anyConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: session.user.id },
          { senderId: session.user.id, receiverId: userId },
        ],
      },
    });
    console.log("PATCH Connection - Any connection found:", anyConnection);

    if (!anyConnection) {
      return NextResponse.json(
        { error: "No connection exists between these users" },
        { status: 404 }
      );
    }

    // Find the specific pending connection
    const connection = await prisma.connection.findFirst({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        status: "PENDING",
      },
    });

    console.log("PATCH Connection - Found connection:", connection);

    if (!connection) {
      return NextResponse.json(
        { error: "No pending connection request found from this user" },
        { status: 404 }
      );
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: { id: connection.id },
      data: {
        status: action === "accept" ? "ACCEPTED" : "REJECTED",
      },
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
    });

    // Create notification for the sender
    await prisma.notification.create({
      data: {
        userId: updatedConnection.senderId,
        type:
          action === "accept" ? "CONNECTION_ACCEPTED" : "CONNECTION_REJECTED",
        message:
          action === "accept"
            ? `${session.user.name} accepted your connection request`
            : `${session.user.name} declined your connection request`,
        read: false,
      },
    });

    console.log("PATCH Connection - Updated connection:", updatedConnection);
    return NextResponse.json(updatedConnection);
  } catch (error) {
    console.error("Error updating connection:", error);
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}

// Delete connection
export async function DELETE(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const params = await context.params;
    console.log("DELETE Connection - Raw params:", params);

    const session = await getServerSession(authOptions);
    console.log("DELETE Connection - Session user:", session?.user);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    console.log("DELETE Connection - Request body:", body);

    const { connectionId } = body;
    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Find the connection and verify ownership
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    console.log("DELETE Connection - Found connection:", connection);

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Verify that the current user is part of the connection
    if (
      connection.senderId !== session.user.id &&
      connection.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to delete this connection" },
        { status: 403 }
      );
    }

    // Delete the connection
    await prisma.connection.delete({
      where: { id: connectionId },
    });

    console.log("DELETE Connection - Connection deleted successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
