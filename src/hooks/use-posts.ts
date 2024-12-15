import { useInfiniteQuery } from "@tanstack/react-query";
import { PostCategory } from "@prisma/client";
import { useSearchParams } from "next/navigation";

export type Post = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: PostCategory;
  createdAt: string;
  featuredImage: string | null;
  upvoteCount: number;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    businessName: string | null;
  };
  tags: Array<{ name: string }>;
  _count: {
    comments: number;
  };
};

interface PostsResponse {
  items: Post[];
  nextCursor?: string;
}

export function usePosts() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const categories = categoryParam?.split(",") as PostCategory[] | undefined;

  return useInfiniteQuery<PostsResponse>({
    queryKey: ["posts", { categories }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam && typeof pageParam === "string") {
        params.set("cursor", pageParam);
      }
      if (categories?.length) {
        params.set("categories", categories.join(","));
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });
}
