import { PostCategory, Role } from "@prisma/client";

export type VideoSource = "youtube" | "vimeo" | "twitter" | "linkedin";

export type PostMetadata = {
  videoSource?: VideoSource;
} & Record<string, unknown>;

export type Post = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: PostCategory;
  createdAt: string;
  featuredImage: string | null;
  videoUrl: string | null;
  metadata: PostMetadata | null;
  upvoteCount: number;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: Role;
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

export interface UserProfileResponse {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: Role;
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

export interface ThoughtLeadershipFormData {
  mediaType: "image" | "video";
  title: string;
  content: string;
  imageUrl?: string;
  videoSource?: "youtube" | "vimeo" | "twitter" | "linkedin";
  videoUrl?: string;
}
