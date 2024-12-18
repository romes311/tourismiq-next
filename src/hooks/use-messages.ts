import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pusherClient } from "@/lib/pusher";
import { useAuth } from "./use-auth";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  senderId: string;
  receiverId: string;
  conversationId: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Conversation {
  id: string;
  updatedAt: string;
  participants: {
    id: string;
    name: string | null;
    image: string | null;
  }[];
  messages: {
    content: string;
    createdAt: string;
    read: boolean;
  }[];
}

export function useMessages(conversationId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = pusherClient.subscribe(`private-user-${user.id}`);

    channel.bind("new-message", (message: Message) => {
      // Update messages for the current conversation
      if (conversationId === message.conversationId) {
        queryClient.setQueryData<Message[]>(
          ["messages", conversationId],
          (old = []) => [message, ...old]
        );
      }

      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [user?.id, conversationId, queryClient]);

  // Query for conversations list
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    enabled: !conversationId && !!user,
  });

  // Query for messages in a specific conversation
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!conversationId && !!user,
  });

  // Mutation for sending a message
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({
      content,
      receiverId,
    }: {
      content: string;
      receiverId: string;
    }) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, receiverId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.json();
    },
    onSuccess: (newMessage) => {
      // Update messages for the current conversation
      if (conversationId === newMessage.conversationId) {
        queryClient.setQueryData<Message[]>(
          ["messages", conversationId],
          (old = []) => [newMessage, ...old]
        );
      }

      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversations,
    isLoadingConversations,
    conversationsError,
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage,
    isSending,
  };
}