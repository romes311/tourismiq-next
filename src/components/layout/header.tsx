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

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement search functionality
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    console.log("Search query:", query);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
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
                className="text-neutral-500 hover:text-primary"
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-primary"
              >
                <BellIcon className="h-5 w-5" />
              </Button>

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
