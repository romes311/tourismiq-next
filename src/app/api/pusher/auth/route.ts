import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("Pusher auth: No session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.formData();
    const socketId = data.get("socket_id") as string;
    const channel = data.get("channel_name") as string;

    if (!socketId || !channel) {
      console.error("Pusher auth: Missing required parameters", {
        socketId,
        channel,
      });
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Only authorize if the channel belongs to the authenticated user
    if (!channel.startsWith(`private-user-${session.user.id}`)) {
      console.error("Pusher auth: Unauthorized channel access", {
        channel,
        userId: session.user.id,
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Authorizing Pusher channel:", {
      channel,
      userId: session.user.id,
    });

    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Error authenticating Pusher channel:", error);
    return NextResponse.json(
      { error: "Failed to authenticate channel" },
      { status: 500 }
    );
  }
}
