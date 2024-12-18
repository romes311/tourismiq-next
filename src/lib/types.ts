import { PostCategory, Role } from "@prisma/client";

export type VideoSource = "youtube" | "vimeo" | "twitter";

export type PostMetadata = {
  videoSource?: VideoSource;
  imageCaption?: string;
  sourceUrl?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  eventLocation?: string;
  hostCompany?: string;
  hostCompanyLogo?: string;
  registrationUrl?: string;
  additionalDetailsUrl?: string;
  author?: string;
  publishDate?: string;
  url?: string;
  authorName?: string;
  purchaseUrl?: string;
  companyLogo?: string;
  courseImage?: string;
  courseUrl?: string;
  signUpUrl?: string;
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
    occupation: string | null;
    interests: string[];
    socialLinks: {
      facebook: string | null;
      twitter: string | null;
      linkedin: string | null;
      instagram: string | null;
    } | null;
  };
}

export interface ThoughtLeadershipFormData {
  mediaType: "image" | "video";
  title: string;
  content: string;
  imageUrl?: string;
  videoSource?: VideoSource;
  videoUrl?: string;
}

export interface NewsFormData {
  title: string;
  imageUrl?: string;
  imageCaption: string;
  content: string;
  sourceUrl: string;
}

export interface EventFormData {
  title: string;
  content: string;
  imageUrl?: string;
  eventStartDate: string;
  eventEndDate: string;
  hostCompany: string;
  hostCompanyLogo?: string;
  eventLocation: string;
  additionalDetailsUrl: string;
  registrationUrl?: string;
}

export interface BlogPostFormData {
  title: string;
  content: string;
  imageUrl?: string;
  publishDate: string;
  author: string;
  url: string;
}

export interface BookFormData {
  title: string;
  coverImage?: string;
  authorName: string;
  content: string;
  purchaseUrl: string;
  category: PostCategory;
}

export interface CourseFormData {
  title: string;
  companyLogo?: string;
  courseImage?: string;
  courseUrl: string;
  signUpUrl: string;
  content: string;
}
