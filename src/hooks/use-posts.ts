import { useQuery } from "@tanstack/react-query";
import { PostCategory } from "@prisma/client";

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

export function usePosts() {
  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/posts");

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message ||
              `Error: ${response.status} ${response.statusText}`
          );
        }

        return response.json();
      } catch (error) {
        throw error;
      }
    },
  });
}
