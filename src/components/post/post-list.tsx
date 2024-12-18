import type { Post } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface PostListProps {
  posts: Post[];
  showAuthor?: boolean;
}

export function PostList({ posts, showAuthor = true }: PostListProps) {
  return (
    <div className="divide-y">
      {posts.map((post) => (
        <article key={post.id} className="p-6">
          <div className="flex items-start space-x-4">
            {showAuthor && (
              <Link href={`/profile/${post.author.id}`}>
                <div className="flex items-center space-x-4">
                  {post.author.image ? (
                    <Image
                      src={post.author.image}
                      alt={post.author.name || ""}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                      <svg
                        className="w-5 h-5"
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
                </div>
              </Link>
            )}
            <div className="flex-1 min-w-0">
              {showAuthor && (
                <div className="flex items-center space-x-2 mb-1">
                  <Link
                    href={`/profile/${post.author.id}`}
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    {post.author.name}
                  </Link>
                  <span className="text-sm text-neutral-500">•</span>
                  <span className="text-sm text-neutral-500">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {post.title}
              </h3>
              <p className="text-neutral-600 line-clamp-3">{post.content}</p>
              {post.featuredImage && (
                <div className="mt-4 relative h-48 rounded-lg overflow-hidden">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="mt-4 flex items-center space-x-4 text-sm text-neutral-500">
                <div className="flex items-center space-x-1">
                  <span>👍</span>
                  <span>{post.upvoteCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>💬</span>
                  <span>{post._count.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
