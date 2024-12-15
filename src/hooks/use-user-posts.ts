import { useInfiniteQuery } from "@tanstack/react-query";
import type { PostsResponse } from "@/lib/types";

export function useUserPosts(userId: string) {
  return useInfiniteQuery<PostsResponse>({
    queryKey: ["user-posts", userId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam && typeof pageParam === "string") {
        params.set("cursor", pageParam);
      }

      const response = await fetch(
        `/api/users/${userId}/posts?${params.toString()}`
      );
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
