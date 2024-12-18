import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import pusherClient from "@/lib/pusher";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface PusherError {
  type: string;
  error: string;
  status: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchInitialNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(
            data.notifications.filter((n: Notification) => !n.read).length
          );
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchInitialNotifications();

    // Subscribe to user's notification channel
    const channelName = `private-user-${user.id}`;
    console.log("Subscribing to channel:", channelName);

    const channel = pusherClient.subscribe(channelName);

    // Handle subscription success
    channel.bind("pusher:subscription_succeeded", () => {
      console.log("Successfully subscribed to channel:", channelName);
    });

    // Handle subscription error
    channel.bind("pusher:subscription_error", (error: PusherError) => {
      console.error("Error subscribing to channel:", error);
    });

    // Handle notifications
    const handleNotification = (notification: Notification) => {
      console.log("Received notification:", notification);

      setNotifications((prev) => {
        // Check if notification already exists
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) {
          console.log("Notification already exists, skipping...");
          return prev;
        }

        console.log("Adding new notification");
        // Add new notification at the beginning
        return [notification, ...prev];
      });

      setUnreadCount((prev) => prev + 1);
    };

    channel.bind("notification", handleNotification);

    return () => {
      console.log("Cleaning up Pusher subscription");
      channel.unbind("notification", handleNotification);
      pusherClient.unsubscribe(channelName);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const clearAll = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
