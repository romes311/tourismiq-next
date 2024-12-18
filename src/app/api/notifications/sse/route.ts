import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Store active connections
const connections = new Map<string, ReadableStreamController<any>>();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // Create a new stream
  const stream = new ReadableStream({
    start(controller) {
      connections.set(userId, controller);
    },
    cancel() {
      connections.delete(userId);
    },
  });

  // Send initial notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      read: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Return the stream response
  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  // Send initial data
  const controller = connections.get(userId);
  if (controller) {
    const data = JSON.stringify({
      type: "initial",
      notifications,
    });
    controller.enqueue(`data: ${data}\n\n`);
  }

  return response;
}

// Helper function to send notifications to a specific user
export async function sendNotification(userId: string, notification: any) {
  const controller = connections.get(userId);
  if (controller) {
    const data = JSON.stringify({
      type: "notification",
      notification,
    });
    controller.enqueue(`data: ${data}\n\n`);
  }
}
