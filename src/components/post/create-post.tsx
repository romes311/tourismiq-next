"use client";

import { useState } from "react";
import Image from "next/image";
import { PostCategory } from "@prisma/client";
import { useAuth } from "@/hooks/use-auth";
import { Menu } from "@headlessui/react";
import { cn } from "@/lib/utils";
import { ThoughtLeadershipForm } from "./thought-leadership-form";
import { NewsForm } from "./news-form";
import { EventsForm } from "./events-form";
import { BlogPostForm } from "./blog-post-form";
import { BookForm } from "./book-form";
import { CourseForm } from "./course-form";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type {
  Post,
  PostsResponse,
  ThoughtLeadershipFormData,
  NewsFormData,
  EventFormData,
  BlogPostFormData,
  BookFormData,
  CourseFormData,
} from "@/lib/types";

// Flatten all categories into a single array
const ALL_CATEGORIES = [
  // Main Categories
  { label: "Thought Leadership", value: PostCategory.THOUGHT_LEADERSHIP },
  { label: "News", value: PostCategory.NEWS },
  { label: "Events", value: PostCategory.EVENTS },
  // Resources
  { label: "Blog Posts", value: PostCategory.BLOG_POSTS },
  { label: "Books", value: PostCategory.BOOKS },
  { label: "Courses", value: PostCategory.COURSES },
  { label: "Podcasts", value: PostCategory.PODCASTS },
  { label: "Presentations", value: PostCategory.PRESENTATIONS },
  { label: "Press Releases", value: PostCategory.PRESS_RELEASES },
  { label: "Templates", value: PostCategory.TEMPLATES },
  { label: "Videos", value: PostCategory.VIDEOS },
  { label: "Webinars", value: PostCategory.WEBINARS },
  { label: "Case Studies", value: PostCategory.CASE_STUDIES },
  { label: "Whitepapers", value: PostCategory.WHITEPAPERS },
  // Jobs
  { label: "Jobs", value: PostCategory.JOBS },
  { label: "Recent Jobs", value: PostCategory.RECENT_JOBS },
];

export function CreatePost() {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleCategorySelect = (category: PostCategory) => {
    setSelectedCategory(category);
    setError(null);
  };

  const handleCloseForm = () => {
    setSelectedCategory(null);
    setError(null);
  };

  const handleSubmitPost = async (
    data:
      | ThoughtLeadershipFormData
      | NewsFormData
      | EventFormData
      | BlogPostFormData
      | BookFormData
      | CourseFormData
  ) => {
    if (!user?.id) {
      throw new Error("You must be logged in to create a post");
    }

    try {
      setError(null);

      // Create the post data
      const postData = {
        ...data,
        category: selectedCategory,
        authorId: user.id,
      };

      // Optimistically add the new post to the cache
      const optimisticPost: Post = {
        id: `temp-${Date.now()}`,
        title: data.title,
        content: data.content,
        summary: null,
        category: selectedCategory!,
        createdAt: new Date().toISOString(),
        featuredImage: "imageUrl" in data ? data.imageUrl || null : null,
        videoUrl: "videoUrl" in data ? data.videoUrl || null : null,
        metadata:
          "videoUrl" in data && data.videoUrl
            ? { videoSource: data.videoSource }
            : "imageCaption" in data
            ? { imageCaption: data.imageCaption, sourceUrl: data.sourceUrl }
            : null,
        upvoteCount: 0,
        authorId: user.id,
        author: {
          id: user.id,
          name: user.name || "",
          image: user.image || null,
          role: user.role || "USER",
          businessName: null,
        },
        tags: [],
        _count: {
          comments: 0,
        },
      };

      // Update both the main feed and user posts cache
      const updateCacheWithOptimisticPost = (
        old: InfiniteData<PostsResponse> | undefined
      ) => {
        if (!old) return old;
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              items: [optimisticPost, ...old.pages[0].items],
            },
            ...old.pages.slice(1),
          ],
        };
      };

      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        ["posts", { categories: undefined }],
        updateCacheWithOptimisticPost
      );

      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        ["user-posts", user.id],
        updateCacheWithOptimisticPost
      );

      // Make the API call
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = "Failed to create post";
        if (responseData.error) {
          errorMessage = responseData.error;
          if (responseData.details) {
            errorMessage +=
              ": " +
              (responseData.details as { message: string }[])
                .map((d) => d.message)
                .join(", ");
          }
        }
        throw new Error(errorMessage);
      }

      // Get the actual post data from the response
      const newPost = responseData;

      // Update both caches with the real post data
      const updateCacheWithRealPost = (
        old: InfiniteData<PostsResponse> | undefined
      ) => {
        if (!old) return old;
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              items: old.pages[0].items.map((post: Post) =>
                post.id === optimisticPost.id ? newPost : post
              ),
            },
            ...old.pages.slice(1),
          ],
        };
      };

      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        ["posts", { categories: undefined }],
        updateCacheWithRealPost
      );

      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        ["user-posts", user.id],
        updateCacheWithRealPost
      );

      // Close the form
      handleCloseForm();
    } catch (error) {
      console.error("Failed to create post:", error);
      // Set the error message
      setError(
        error instanceof Error ? error.message : "Failed to create post"
      );
      // Revert both caches on error
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts", user.id] });
      throw error;
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Image
            src={
              user?.image ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`
            }
            alt="Your avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <Menu as="div" className="relative flex-1">
            <Menu.Button className="w-full rounded-md border bg-neutral-50 px-4 py-2 text-left text-lg text-neutral-500 hover:bg-neutral-100">
              Share your insights...
            </Menu.Button>

            <Menu.Items className="absolute left-0 right-0 z-50 mt-1 max-h-[320px] overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {ALL_CATEGORIES.map((category) => (
                <Menu.Item key={category.value}>
                  {({ active }) => (
                    <button
                      onClick={() => handleCategorySelect(category.value)}
                      className={cn(
                        "flex w-full items-center px-3 py-1.5 text-lg",
                        active
                          ? "bg-neutral-50 text-primary"
                          : "text-neutral-700"
                      )}
                    >
                      {category.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Category-specific Forms */}
      {selectedCategory === PostCategory.THOUGHT_LEADERSHIP && (
        <ThoughtLeadershipForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleSubmitPost}
          error={error}
        />
      )}
      {selectedCategory === PostCategory.NEWS && (
        <NewsForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleSubmitPost}
          error={error}
        />
      )}
      {selectedCategory === PostCategory.EVENTS && (
        <EventsForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleSubmitPost}
          error={error}
        />
      )}
      {selectedCategory === PostCategory.BLOG_POSTS && (
        <BlogPostForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleSubmitPost}
          error={error}
        />
      )}
      {selectedCategory === PostCategory.BOOKS && (
        <BookForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleSubmitPost}
          error={error}
        />
      )}
      {selectedCategory === PostCategory.COURSES && (
        <CourseForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleSubmitPost}
          error={error}
        />
      )}
      {/* We'll add other category forms here later */}
    </>
  );
}
