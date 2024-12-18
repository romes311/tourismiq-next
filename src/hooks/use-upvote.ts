import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const UPVOTED_POSTS_KEY = "upvoted_posts";

export function useUpvote(postId: string) {
  const queryClient = useQueryClient();
  const [isUpvoted, setIsUpvoted] = useState(false);

  // Load upvoted state from localStorage
  useEffect(() => {
    const upvotedPosts = JSON.parse(
      localStorage.getItem(UPVOTED_POSTS_KEY) || "[]"
    );
    setIsUpvoted(upvotedPosts.includes(postId));
  }, [postId]);

  const { mutate: toggleUpvote, isPending: isUpvoting } = useMutation({
    mutationFn: async () => {
      const action = isUpvoted ? "remove" : "upvote";

      const response = await fetch("/api/posts/upvote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update upvote");
      }

      // Update localStorage
      const upvotedPosts = JSON.parse(
        localStorage.getItem(UPVOTED_POSTS_KEY) || "[]"
      );

      if (isUpvoted) {
        localStorage.setItem(
          UPVOTED_POSTS_KEY,
          JSON.stringify(upvotedPosts.filter((id: string) => id !== postId))
        );
      } else {
        localStorage.setItem(
          UPVOTED_POSTS_KEY,
          JSON.stringify([...upvotedPosts, postId])
        );
      }

      // Update local state
      setIsUpvoted(!isUpvoted);

      // Refetch posts to get updated counts
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });

  return {
    isUpvoted,
    toggleUpvote,
    isUpvoting,
  };
}
