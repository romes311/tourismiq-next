"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePosts } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CreatePost } from "@/components/post/create-post";
import { PostCard } from "@/components/post/post-card";
import Link from "next/link";

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
    <div>
      {/* Sticky Create Post Section */}
      <div className="sticky top-[4.5rem] z-10">
        <div className="absolute inset-x-0 -top-4 h-4 bg-neutral-50" />
        <div className="-mx-4 bg-neutral-50 px-4 pb-6 pt-4 shadow-sm">
          {!isAuthenticated ? <JoinBanner /> : <CreatePost />}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="mt-6 space-y-6">
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
    </div>
  );
}
