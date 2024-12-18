"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const isActiveLink = (category?: string) => {
    if (category) {
      return currentCategory === category;
    }
    return (
      pathname === "/events" || pathname === "/vendors" || pathname === "/qa"
    );
  };

  return (
    <aside className="p-6" aria-label="Sidebar navigation">
      {/* Main Navigation */}
      <nav className="space-y-1" aria-label="Main">
        <Link
          href="/?category=thought_leadership"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isActiveLink("thought_leadership")
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={isActiveLink("thought_leadership") ? "page" : undefined}
        >
          Thought Leadership
        </Link>

        <Link
          href="/?category=news"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isActiveLink("news")
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={isActiveLink("news") ? "page" : undefined}
        >
          News
        </Link>

        <Link
          href="/?category=people"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isActiveLink("people")
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={isActiveLink("people") ? "page" : undefined}
        >
          People on the Move
        </Link>

        <Link
          href="/?category=jobs"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isActiveLink("jobs")
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={isActiveLink("jobs") ? "page" : undefined}
        >
          Jobs
        </Link>

        <Link
          href="/?category=resources"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isActiveLink("resources")
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={isActiveLink("resources") ? "page" : undefined}
        >
          Resources
        </Link>

        <Link
          href="/events"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === "/events"
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={pathname === "/events" ? "page" : undefined}
        >
          Events
        </Link>

        <Link
          href="/vendors"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === "/vendors"
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={pathname === "/vendors" ? "page" : undefined}
        >
          Vendor Directory
        </Link>

        <Link
          href="/qa"
          className={cn(
            "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === "/qa"
              ? "bg-primary/5 text-primary"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
          )}
          aria-current={pathname === "/qa" ? "page" : undefined}
        >
          Community Q&A
        </Link>

        <div className="px-4 py-2 text-sm font-medium text-neutral-400">
          Education (Coming Soon)
        </div>
      </nav>

      {/* Bookmarks Section */}
      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <span role="img" aria-label="Bookmarks">
            📚
          </span>
          <span>Bookmarks</span>
        </h2>
      </div>

      {/* Newsletter Section */}
      <div className="mt-8">
        <div className="px-4">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">
            Subscribe to our Newsletter
          </h2>
          <form className="space-y-3">
            <div>
              <label htmlFor="email" className="sr-only">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="Email Address*"
                className="w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8">
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500"
        >
          <Link href="/sponsorships" className="hover:text-primary">
            Sponsorships
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms & Use
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
        </nav>
        <p className="mt-4 text-xs text-neutral-400">
          © TourismIQ 2024. All rights reserved.
        </p>
      </div>
    </aside>
  );
}
