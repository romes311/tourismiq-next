"use client";

import { useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [messageInput, setMessageInput] = useState("");
  const { user } = useAuth();
  const {
    conversations,
    isLoadingConversations,
    messages,
    isLoadingMessages,
    sendMessage,
    isSending,
  } = useMessages(selectedConversationId);

  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId
  );
  const recipient = selectedConversation?.participants[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !messageInput.trim()) return;

    sendMessage(
      { content: messageInput, receiverId: recipient.id },
      {
        onSuccess: () => {
          setMessageInput("");
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-neutral-600">Please sign in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl px-4 py-6">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
        {/* Conversations List */}
        <div className="col-span-4 bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-neutral-900">Messages</h2>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            {isLoadingConversations ? (
              <div className="p-4">
                <p className="text-neutral-600">Loading conversations...</p>
              </div>
            ) : conversations?.length === 0 ? (
              <div className="p-4">
                <p className="text-neutral-600">No conversations yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations?.map((conversation) => {
                  const participant = conversation.participants[0];
                  const lastMessage = conversation.messages[0];
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-neutral-50 transition-colors",
                        selectedConversationId === conversation.id &&
                          "bg-neutral-100"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        {participant.image ? (
                          <Image
                            src={participant.image}
                            alt={participant.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {participant.name}
                          </p>
                          {lastMessage && (
                            <p className="text-sm text-neutral-500 truncate">
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-xs text-neutral-400">
                            {format(
                              new Date(lastMessage.createdAt),
                              "MMM d, h:mm a"
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="col-span-8 bg-white rounded-lg border shadow-sm flex flex-col">
          {selectedConversationId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  {recipient?.image ? (
                    <Image
                      src={recipient.image}
                      alt={recipient.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h2 className="font-medium text-neutral-900">
                      {recipient?.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <p className="text-neutral-600">Loading messages...</p>
                ) : messages?.length === 0 ? (
                  <p className="text-neutral-600 text-center">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderId === user.id
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            message.senderId === user.id
                              ? "bg-primary text-white"
                              : "bg-neutral-100"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.senderId === user.id
                                ? "text-primary-50"
                                : "text-neutral-400"
                            )}
                          >
                            {format(
                              new Date(message.createdAt),
                              "MMM d, h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending}>
                    Send
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-600">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
