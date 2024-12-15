"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePosts, type Post } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { PostImage } from "@/components/ui/post-image";
import { PostButtons } from "@/components/post/post-buttons";
import { PostCategory } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { PostComments } from "@/components/post/post-comments";
import { CreatePost } from "@/components/post/create-post";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { PostsResponse } from "@/lib/types";
import { VideoEmbed } from "@/components/ui/video-embed";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
}

function JoinBanner() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-neutral-900">
        Join the Tourism Community
      </h2>
      <p className="mt-2 text-neutral-600">
        Connect with tourism professionals, share experiences, and discover
        amazing destinations.
      </p>
      <div className="mt-4 flex gap-4">
        <Link href="/register">
          <Button>Get Started</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Sign In</Button>
        </Link>
      </div>
    </div>
  );
}

const getCategoryColor = (category: PostCategory): string => {
  // Pink categories
  if (["NEWS", "PRESENTATIONS", "PRESS_RELEASES"].includes(category)) {
    return "var(--category-pink)";
  }

  // Orange categories
  if (
    [
      "WEBINARS",
      "BLOG_POSTS",
      "BOOKS",
      "VIDEOS",
      "PODCASTS",
      "COURSES",
      "WHITEPAPERS",
      "CASE_STUDIES",
      "TEMPLATES",
    ].includes(category)
  ) {
    return "var(--category-orange)";
  }

  // Blue category
  if (category === "THOUGHT_LEADERSHIP") {
    return "var(--category-blue)";
  }

  // Green category
  if (category === "EVENTS") {
    return "var(--category-green)";
  }

  // Red categories
  if (["JOBS", "RECENT_JOBS"].includes(category)) {
    return "var(--category-red)";
  }

  return "#6b7280"; // fallback color (neutral-500)
};

function formatCategory(category: PostCategory): string {
  // Convert enum value to string and replace underscores with spaces
  const formatted = category.toString().replace(/_/g, " ");

  // Convert to title case (first letter of each word capitalized)
  return formatted
    .split(" ")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete post");
      }

      // Remove the post from both caches
      const updateCache = (old: InfiniteData<PostsResponse> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((p) => p.id !== post.id),
          })),
        };
      };

      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        ["posts", { categories: undefined }],
        updateCache
      );

      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        ["user-posts", user.id],
        updateCache
      );
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert(error instanceof Error ? error.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComment = () => {
    setShowComments(!showComments);
    if (!showComments && !comments) {
      loadComments();
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load comments");
      }
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (content: string) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      const newComment = await response.json();
      setComments((prev) => [newComment, ...(prev || [])]);
      setCommentCount((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  };

  const handleShare = () => {
    console.log("Share post:", post.id);
  };

  const categoryColor = getCategoryColor(post.category);

  return (
    <article className="relative overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Delete Button - Show for admin or post author */}
      {user && (user.role === "ADMIN" || user.id === post.authorId) && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-2 top-2 z-50 rounded-full bg-red-100 p-2 text-red-600 shadow-lg hover:bg-red-200 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <XMarkIcon className="h-6 w-6" />
          {isDeleting && <span className="sr-only">Deleting...</span>}
        </button>
      )}

      {/* Featured Media */}
      {post.videoUrl ? (
        <div className="p-4">
          <VideoEmbed
            url={post.videoUrl}
            videoSource={post.metadata?.videoSource || "youtube"}
          />
        </div>
      ) : post.featuredImage ? (
        <div>
          <PostImage src={post.featuredImage} alt={post.title} />
        </div>
      ) : null}

      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-4">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {formatCategory(post.category)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-primary">{post.title}</h2>

        {/* Author Meta & Date */}
        <div className="mt-4 flex items-center space-x-4">
          <Image
            src={
              post.author.image ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`
            }
            alt={post.author.name || ""}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <p className="font-medium text-primary">
              {post.author.name}
              {post.author.businessName && (
                <span className="ml-2 text-sm text-neutral-500">
                  at {post.author.businessName}
                </span>
              )}
            </p>
            <p className="text-sm text-neutral-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        {/* Description */}
        {post.summary && (
          <p className="mt-4 text-neutral-600">{post.summary}</p>
        )}
        <div className="mt-4 line-clamp-3 text-neutral-600">{post.content}</div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-6 border-t pt-4">
          <PostButtons
            postId={post.id}
            upvoteCount={post.upvoteCount}
            commentCount={commentCount}
            onComment={handleComment}
            onShare={handleShare}
          />
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t">
            {isLoadingComments ? (
              <div className="p-4 text-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Comments ({commentCount})
                  </h3>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Hide comments
                  </button>
                </div>
                <PostComments
                  postId={post.id}
                  comments={comments}
                  onAddComment={handleAddComment}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
        <p className="mt-4 text-sm text-neutral-500">Loading posts...</p>
      </div>
    </div>
  );
}

function ErrorMessage({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-600">{error.message}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function PostFeed() {
  const { isAuthenticated } = useAuth();
  const {
    data,
    isLoading,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePosts();

  // Set up intersection observer for infinite scroll
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  return (
    <div className="space-y-6">
      {!isAuthenticated && <JoinBanner />}
      {isAuthenticated && <CreatePost />}

      {isLoading && <LoadingSpinner />}

      {isError && (
        <ErrorMessage
          error={
            error instanceof Error ? error : new Error("Failed to load posts")
          }
          onRetry={() => window.location.reload()}
        />
      )}

      {!isLoading && !isError && !data?.pages[0]?.items.length && (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="text-neutral-600">No posts yet</p>
        </div>
      )}

      {!isLoading &&
        !isError &&
        data?.pages.map((page, i) => (
          <div key={i} className="space-y-6">
            {page.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ))}

      {/* Load more trigger */}
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <LoadingSpinner />}
      </div>
    </div>
  );
}
