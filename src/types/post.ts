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
  authorId: string;
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

export interface PostsResponse {
  items: Post[];
  nextCursor?: string;
}

// Add a type for user profile posts
export interface UserProfileResponse {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    businessName: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    socialLinks: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
    } | null;
  };
  posts: PostsResponse;
}
