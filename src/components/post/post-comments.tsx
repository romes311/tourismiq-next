"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
}

interface PostCommentsProps {
  postId: string;
  comments: Comment[] | null;
  onAddComment: (content: string) => Promise<void>;
}

export function PostComments({ comments, onAddComment }: PostCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment input */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-lg placeholder:text-neutral-500 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
              className="text-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner className="h-4 w-4" />
                  Posting...
                </span>
              ) : (
                "Post Comment"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg bg-neutral-50 p-4 text-center">
          <p className="text-lg text-primary">
            Please{" "}
            <Link href="/login" className="text-primary hover:underline">
              sign in
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-2">
        {comments?.map((comment) => (
          <div
            key={comment.id}
            className="group rounded-lg bg-neutral-50 transition-all duration-200"
          >
            <div className="flex items-start space-x-4">
              {comment.author.image ? (
                <Image
                  src={comment.author.image}
                  alt={comment.author.name || ""}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-medium text-primary">
                    {comment.author.name}
                  </p>
                  <span className="text-xs text-neutral-500">·</span>
                  <p className="text-xs text-neutral-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <p className="text-lg text-primary">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
        {comments?.length === 0 && (
          <div className="rounded-lg bg-neutral-50 p-3 text-center">
            <p className="text-lg text-primary">
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
