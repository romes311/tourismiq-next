import { useSession, signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import pusherClient from "@/lib/pusher";
import type { Channel } from "pusher-js";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
}

interface ProfileUpdateEvent {
  type: "PROFILE_IMAGE_UPDATE";
  user: {
    id: string;
    name: string | null;
    image: string;
  };
}

interface PusherError {
  type: string;
  error: string;
  status: number;
}

// Global reference for the Pusher channel
let globalChannelRef: Channel | null = null;
let subscribedUserId: string | null = null;

export const useAuth = () => {
  const { data: session, status, update } = useSession();
  const queryClient = useQueryClient();
  const handlersRef = useRef<{
    [key: string]: (data: ProfileUpdateEvent) => void;
  }>({});

  useEffect(() => {
    const currentSession = session;
    if (!currentSession?.user?.id) return;

    // Only subscribe if we haven't already subscribed for this user
    if (!globalChannelRef || subscribedUserId !== currentSession.user.id) {
      // Clean up any existing subscription
      if (globalChannelRef) {
        globalChannelRef.unbind_all();
        pusherClient.unsubscribe("user-updates");
        globalChannelRef = null;
        subscribedUserId = null;
      }

      // Create new subscription
      globalChannelRef = pusherClient.subscribe("user-updates");
      subscribedUserId = currentSession.user.id;

      // Log any subscription errors
      globalChannelRef.bind(
        "pusher:subscription_error",
        (error: PusherError) => {
          console.error("🔴 Pusher subscription error:", error);
        }
      );
    }

    // Create event handler for this instance
    const eventName = `profile-update-${currentSession.user.id}`;

    const handleProfileUpdate = async (data: ProfileUpdateEvent) => {
      if (data.user.id === currentSession.user.id) {
        console.log("🔄 Profile update received:", {
          from: currentSession.user.image,
          to: data.user.image,
        });

        if (data.type === "PROFILE_IMAGE_UPDATE") {
          try {
            // Update the session
            await update({
              ...currentSession,
              user: {
                ...currentSession.user,
                image: data.user.image,
              },
            });

            // Update the user in React Query's cache
            queryClient.setQueryData(["auth"], {
              user: {
                ...currentSession.user,
                image: data.user.image,
              },
              isAuthenticated: true,
              isLoading: false,
            });

            // Update any queries that might contain the user's image
            queryClient.setQueriesData(
              { queryKey: ["profile"] },
              (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  user: {
                    ...oldData.user,
                    image: data.user.image,
                  },
                };
              }
            );

            console.log("✅ Profile image updated successfully");
          } catch (error) {
            console.error("❌ Error updating profile:", error);
          }
        }
      }
    };

    // Store the handler reference
    handlersRef.current[eventName] = handleProfileUpdate;

    // Bind the handler
    globalChannelRef.bind(eventName, handleProfileUpdate);

    // Get a stable reference to the current handler
    const currentHandler = handlersRef.current[eventName];

    // Cleanup function
    return () => {
      if (globalChannelRef) {
        globalChannelRef.unbind(eventName, currentHandler);
        delete handlersRef.current[eventName];
      }
    };
  }, [session, update, queryClient]);

  return {
    user: session?.user as User | undefined,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signOut,
  };
};
