"use client";

import { useState } from "react";
import Image from "next/image";
import { PostCategory } from "@prisma/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { Post, PostsResponse } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { VideoEmbed } from "@/components/ui/video-embed";
import { PostImage } from "@/components/ui/post-image";
import { PostButtons } from "@/components/post/post-buttons";
import { PostComments } from "@/components/post/post-comments";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
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

function LoadingSpinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
  );
}

export function PostCard({ post }: { post: Post }) {
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
              <Link
                href={`/profile/${post.author.id}`}
                className="hover:underline"
              >
                {post.author.name}
              </Link>
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

        {/* Category-specific Content */}
        {post.category === PostCategory.EVENTS && post.metadata && (
          <div className="mt-6 space-y-4 rounded-lg border bg-neutral-50 p-4">
            {/* Event Date & Time */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">When</h3>
              <div className="text-neutral-600">
                <div>
                  Starts:{" "}
                  {new Date(
                    post.metadata.eventStartDate as string
                  ).toLocaleString()}
                </div>
                <div>
                  Ends:{" "}
                  {new Date(
                    post.metadata.eventEndDate as string
                  ).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Event Location */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Where</h3>
              <p className="text-neutral-600">{post.metadata.eventLocation}</p>
            </div>

            {/* Host Company */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Hosted by</h3>
              <div className="flex items-center gap-3">
                {post.metadata.hostCompanyLogo && (
                  <Image
                    src={post.metadata.hostCompanyLogo}
                    alt={post.metadata.hostCompany as string}
                    width={40}
                    height={40}
                    className="rounded-lg object-contain"
                  />
                )}
                <span className="text-neutral-600">
                  {post.metadata.hostCompany}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {post.metadata.registrationUrl && (
                <a
                  href={post.metadata.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  Register Now
                </a>
              )}
              <a
                href={post.metadata.additionalDetailsUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                More Details
              </a>
            </div>
          </div>
        )}

        {post.category === PostCategory.NEWS && post.metadata && (
          <div className="mt-6 space-y-4 rounded-lg border bg-neutral-50 p-4">
            {/* Image Caption */}
            {post.metadata.imageCaption && (
              <div className="flex flex-col space-y-1">
                <h3 className="font-medium text-neutral-900">Image Caption</h3>
                <p className="text-neutral-600">{post.metadata.imageCaption}</p>
              </div>
            )}

            {/* Source Link */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Source</h3>
              <a
                href={post.metadata.sourceUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Original Article
              </a>
            </div>
          </div>
        )}

        {post.category === PostCategory.THOUGHT_LEADERSHIP && post.metadata && (
          <div className="mt-6 space-y-4">
            {/* Video source attribution if it's a video post */}
            {post.videoUrl && post.metadata.videoSource && (
              <div className="text-sm text-neutral-500">
                Video source: {post.metadata.videoSource}
              </div>
            )}
          </div>
        )}

        {post.category === PostCategory.BLOG_POSTS && post.metadata && (
          <div className="mt-6 space-y-4 rounded-lg border bg-neutral-50 p-4">
            {/* Author */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Written by</h3>
              <p className="text-neutral-600">{String(post.metadata.author)}</p>
            </div>

            {/* Publish Date */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Published</h3>
              <p className="text-neutral-600">
                {new Date(String(post.metadata.publishDate)).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>

            {/* Blog URL */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Read More</h3>
              <a
                href={String(post.metadata.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Original Post
              </a>
            </div>
          </div>
        )}

        {post.category === PostCategory.BOOKS && post.metadata && (
          <div className="mt-6 space-y-4 rounded-lg border bg-neutral-50 p-4">
            {/* Book Author */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Written by</h3>
              <p className="text-neutral-600">
                {String(post.metadata.authorName)}
              </p>
            </div>

            {/* Purchase Link */}
            <div className="flex flex-col space-y-1">
              <h3 className="font-medium text-neutral-900">Get the Book</h3>
              <a
                href={String(post.metadata.purchaseUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Purchase Now
              </a>
            </div>
          </div>
        )}

        {post.category === PostCategory.COURSES && post.metadata && (
          <div className="mt-6 space-y-4 rounded-lg border bg-neutral-50 p-4">
            {/* Company Logo */}
            {typeof post.metadata.companyLogo === "string" && (
              <div className="flex flex-col space-y-1">
                <h3 className="font-medium text-neutral-900">Offered by</h3>
                <div className="relative h-16 w-32">
                  <Image
                    src={post.metadata.companyLogo}
                    alt="Company Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Course Image */}
            {typeof post.metadata.courseImage === "string" && (
              <div className="flex flex-col space-y-1">
                <h3 className="font-medium text-neutral-900">Course Preview</h3>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={post.metadata.courseImage}
                    alt="Course Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {typeof post.metadata.courseUrl === "string" &&
              typeof post.metadata.signUpUrl === "string" && (
                <div className="flex gap-3">
                  <a
                    href={post.metadata.courseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    View Course
                  </a>
                  <a
                    href={post.metadata.signUpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    Sign Up
                  </a>
                </div>
              )}
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
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
