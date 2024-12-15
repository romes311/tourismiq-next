"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PostCategory } from "@prisma/client";

const navigation = [
  {
    name: "Thought Leadership",
    category: PostCategory.THOUGHT_LEADERSHIP,
  },
  {
    name: "News",
    category: PostCategory.NEWS,
  },
  {
    name: "People on the Move",
    href: "/people",
  },
  {
    name: "Jobs",
    href: "/jobs",
  },
  {
    name: "Resources",
    category: [
      PostCategory.BLOG_POSTS,
      PostCategory.BOOKS,
      PostCategory.COURSES,
      PostCategory.PODCASTS,
      PostCategory.PRESENTATIONS,
      PostCategory.PRESS_RELEASES,
      PostCategory.TEMPLATES,
      PostCategory.VIDEOS,
      PostCategory.WEBINARS,
      PostCategory.WHITEPAPERS,
      PostCategory.CASE_STUDIES,
    ],
  },
  {
    name: "Events",
    category: PostCategory.EVENTS,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const handleCategoryClick = (
    item: (typeof navigation)[0],
    e: React.MouseEvent
  ) => {
    e.preventDefault();

    if (item.href) {
      router.push(item.href);
      return;
    }

    // If it's a category filter
    if (item.category) {
      if (Array.isArray(item.category)) {
        // For Resources, join multiple categories
        const categories = item.category.join(",");
        router.push(`/?category=${categories}`);
      } else {
        // For single category
        router.push(`/?category=${item.category}`);
      }
    }
  };

  return (
    <nav className="flex flex-col space-y-4">
      {navigation.map((item) => {
        const isActive = item.href
          ? pathname === item.href
          : Array.isArray(item.category)
          ? item.category.some((cat) => currentCategory?.includes(cat))
          : currentCategory === item.category;

        return (
          <a
            key={item.name}
            href={item.href || "#"}
            onClick={(e) => handleCategoryClick(item, e)}
            className={cn(
              "text-2xl font-bold hover:text-primary",
              isActive ? "text-primary" : "text-neutral-500"
            )}
          >
            {item.name}
          </a>
        );
      })}
    </nav>
  );
}
