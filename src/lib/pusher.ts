import PusherServer from "pusher";
import PusherClient from "pusher-js";

interface PusherError {
  type: string;
  error: string;
  status: number;
}

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: "/api/pusher/auth",
  auth: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

// Add connection logging
pusherClient.connection.bind("connected", () => {
  console.log("Connected to Pusher");
});

pusherClient.connection.bind("error", (err: PusherError) => {
  console.error("Pusher connection error:", err);
});

export default pusherClient;
