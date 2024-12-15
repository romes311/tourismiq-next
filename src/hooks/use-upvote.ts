import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface UpvoteResponse {
  upvoted: boolean;
  upvoteCount: number;
}

const UPVOTED_POSTS_KEY = "upvoted_posts";

export function useUpvote(postId: string) {
  const queryClient = useQueryClient();
  const [isUpvoted, setIsUpvoted] = useState(false);

  // Load upvoted state from localStorage on mount
  useEffect(() => {
    const upvotedPosts = JSON.parse(
      localStorage.getItem(UPVOTED_POSTS_KEY) || "[]"
    );
    setIsUpvoted(upvotedPosts.includes(postId));
  }, [postId]);

  const { mutate: toggleUpvote, isPending: isUpvoting } = useMutation({
    mutationFn: async () => {
      const method = isUpvoted ? "DELETE" : "POST";
      const response = await fetch(`/api/posts/${postId}/upvote`, {
        method,
      });
      if (!response.ok) {
        throw new Error("Failed to toggle upvote");
      }
      return response.json() as Promise<UpvoteResponse>;
    },
    onSuccess: (data) => {
      // Update localStorage
      const upvotedPosts = JSON.parse(
        localStorage.getItem(UPVOTED_POSTS_KEY) || "[]"
      );
      if (data.upvoted) {
        localStorage.setItem(
          UPVOTED_POSTS_KEY,
          JSON.stringify([...upvotedPosts, postId])
        );
      } else {
        localStorage.setItem(
          UPVOTED_POSTS_KEY,
          JSON.stringify(upvotedPosts.filter((id: string) => id !== postId))
        );
      }
      setIsUpvoted(data.upvoted);

      // Invalidate the posts query to update the upvote count
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    isUpvoted,
    toggleUpvote,
    isUpvoting,
  };
}
