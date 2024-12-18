import { pusherServer } from "./pusher";
import { prisma } from "./prisma";

interface NotificationData {
  userId: string;
  type: string;
  message: string;
}

export async function sendNotification({
  userId,
  type,
  message,
}: NotificationData) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        read: false,
      },
    });

    // Send real-time notification via Pusher
    await pusherServer.trigger(
      `private-user-${userId}`,
      "notification",
      notification
    );

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}
