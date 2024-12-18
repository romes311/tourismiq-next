import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  receiverId: z.string().min(1, "Receiver ID is required"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { content, receiverId } = messageSchema.parse(body);

    // Find or create conversation between the two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: session.user.id } } },
          { participants: { some: { id: receiverId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: session.user.id }, { id: receiverId }],
          },
        },
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Trigger Pusher event
    await pusherServer.trigger(
      `private-user-${receiverId}`,
      "new-message",
      message
    );

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      // Get all conversations for the user
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { id: session.user.id },
          },
        },
        include: {
          participants: {
            where: {
              id: { not: session.user.id },
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            select: {
              content: true,
              createdAt: true,
              read: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return NextResponse.json(conversations);
    }

    // Get messages for a specific conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        conversation: {
          participants: {
            some: { id: session.user.id },
          },
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Mark messages as read
    if (messages.length > 0) {
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
