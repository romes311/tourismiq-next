"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { Menu } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const { data: unreadMessageCount } = useQuery({
    queryKey: ["unread-messages"],
    queryFn: async () => {
      const response = await fetch("/api/messages/unread-count");
      if (!response.ok) {
        throw new Error("Failed to fetch unread message count");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement search functionality
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    console.log("Search query:", query);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">TourismIQ</span>
        </Link>

        {/* Center section - Search */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center w-full max-w-md mx-8"
        >
          <div className="relative w-full">
            <Input
              type="search"
              name="search"
              placeholder="Search posts, people, and more..."
              className="w-full pl-10 bg-neutral-50 border-neutral-200 focus:border-primary focus:ring-primary"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          </div>
        </form>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-primary"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-primary"
              >
                <TrophyIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-neutral-500 hover:text-primary"
                onClick={() => router.push(`/profile/${user?.id}?tab=messages`)}
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
                {unreadMessageCount?.count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
                    {unreadMessageCount.count}
                  </span>
                )}
              </Button>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-neutral-500 hover:text-primary"
                    aria-label="Notifications"
                  >
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-white" align="end">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-sm"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                    {notifications.length > 0 ? (
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "flex flex-col gap-2 rounded-lg p-3 transition-colors",
                              !notification.read && "bg-neutral-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm flex-1">
                                {notification.message}
                              </p>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="shrink-0"
                                >
                                  Mark as read
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-neutral-500">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString()}
                              </p>
                              {notification.type === "CONNECTION_REQUEST" && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-primary"
                                  onClick={() => {
                                    // Close the popover
                                    const button = document.querySelector(
                                      '[aria-label="Notifications"]'
                                    );
                                    if (button) {
                                      (button as HTMLButtonElement).click();
                                    }
                                    // Navigate to the connections tab
                                    router.push(
                                      `/profile/${user?.id}?tab=connections`
                                    );
                                    // Mark as read
                                    if (!notification.read) {
                                      markAsRead(notification.id);
                                    }
                                  }}
                                >
                                  View Request →
                                </Button>
                              )}
                              {notification.type === "CONNECTION_ACCEPTED" && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-primary"
                                  onClick={() => {
                                    // Close the popover
                                    const button = document.querySelector(
                                      '[aria-label="Notifications"]'
                                    );
                                    if (button) {
                                      (button as HTMLButtonElement).click();
                                    }
                                    // Navigate to the connections tab
                                    router.push(
                                      `/profile/${user?.id}?tab=connections`
                                    );
                                    // Mark as read
                                    if (!notification.read) {
                                      markAsRead(notification.id);
                                    }
                                  }}
                                >
                                  View Connections →
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-neutral-500">
                        No notifications
                      </p>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center justify-center rounded-full overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                  <Image
                    src={
                      user?.image ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`
                    }
                    alt="Your avatar"
                    width={36}
                    height={36}
                    className="rounded-full transition-all duration-300 ease-in-out"
                  />
                </Menu.Button>

                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push(`/profile/${user?.id}`)}
                        className={`${
                          active
                            ? "bg-neutral-50 text-primary"
                            : "text-neutral-700"
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        View Profile
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className={`${
                          active
                            ? "bg-neutral-50 text-primary"
                            : "text-neutral-700"
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-primary">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
