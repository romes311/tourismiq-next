"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
                className="text-primary"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="text-primary"
                onClick={() => router.push(`/profile/${user?.id}`)}
              >
                Profile
              </Button>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
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
