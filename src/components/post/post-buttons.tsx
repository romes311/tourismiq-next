"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { ArrowUpIcon as ArrowUpIconSolid } from "@heroicons/react/24/solid";
import { useAuth } from "@/hooks/use-auth";
import { useUpvote } from "@/hooks/use-upvote";

interface PostButtonsProps {
  postId: string;
  upvoteCount: number;
  commentCount: number;
  onComment?: () => void;
  onShare?: () => void;
}

export function PostButtons({
  postId,
  upvoteCount,
  commentCount,
  onComment,
  onShare,
}: PostButtonsProps) {
  const { isAuthenticated } = useAuth();
  const { isUpvoted, toggleUpvote, isUpvoting } = useUpvote(postId);

  const handleUpvoteClick = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    toggleUpvote();
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    onComment?.();
  };

  const handleShareClick = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    onShare?.();
  };

  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-neutral-500"
        onClick={handleUpvoteClick}
        disabled={isUpvoting}
      >
        {isUpvoted ? (
          <ArrowUpIconSolid className="mr-1.5 h-5 w-5 text-emerald-500" />
        ) : (
          <ArrowUpIcon className="mr-1.5 h-5 w-5" />
        )}
        {upvoteCount}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-neutral-500"
        onClick={handleCommentClick}
      >
        <ChatBubbleLeftIcon className="mr-1.5 h-5 w-5" />
        {commentCount}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-neutral-500"
        onClick={handleShareClick}
      >
        <ShareIcon className="mr-1.5 h-5 w-5" />
        Share
      </Button>
    </div>
  );
}
