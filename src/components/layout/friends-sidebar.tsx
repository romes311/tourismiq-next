"use client";

import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This would come from your API in a real app
const mockFriends = [
  {
    id: "1",
    name: "Alice Johnson",
    role: "Tour Guide",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: "2",
    name: "Bob Smith",
    role: "Hotel Owner",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "3",
    name: "Carol White",
    role: "Travel Agent",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
  },
];

export function FriendsSidebar() {
  const { isAuthenticated } = useAuth();

  return (
    <aside className="w-64 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">
          {isAuthenticated ? "Your Network" : "Featured Members"}
        </h3>
        {isAuthenticated ? (
          <p className="text-sm text-neutral-500">
            {mockFriends.length} connections
          </p>
        ) : (
          <p className="text-sm text-neutral-500">
            Join to connect with tourism professionals
          </p>
        )}
      </div>

      <div className="space-y-4">
        {mockFriends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center space-x-3 rounded-lg p-2 hover:bg-neutral-100"
          >
            <Image
              src={friend.image}
              alt={friend.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {friend.name}
              </p>
              <p className="text-xs text-neutral-500">{friend.role}</p>
            </div>
          </div>
        ))}

        {isAuthenticated ? (
          <Link
            href="/network"
            className="block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all connections →
          </Link>
        ) : (
          <div className="space-y-2">
            <Link href="/register">
              <Button className="w-full" size="sm">
                Join Now
              </Button>
            </Link>
            <p className="text-xs text-center text-neutral-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
