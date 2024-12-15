import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PostCategory } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const POSTS_PER_PAGE = 5;

const createPostSchema = z.discriminatedUnion("category", [
  // Thought Leadership Post Schema
  z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    category: z.literal(PostCategory.THOUGHT_LEADERSHIP),
    mediaType: z.enum(["image", "video"]),
    imageUrl: z.string().optional(),
    videoSource: z.enum(["youtube", "vimeo", "twitter"]).optional(),
    videoUrl: z.string().optional(),
    authorId: z.string(),
  }),
  // News Post Schema
  z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    category: z.literal(PostCategory.NEWS),
    imageUrl: z.string(),
    imageCaption: z.string().min(1, "Image caption is required"),
    sourceUrl: z.string().url("Invalid source URL"),
    authorId: z.string(),
  }),
  // Event Post Schema
  z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    category: z.literal(PostCategory.EVENTS),
    imageUrl: z.string().optional(),
    eventStartDate: z.string().min(1, "Event start date is required"),
    eventEndDate: z.string().min(1, "Event end date is required"),
    hostCompany: z.string().min(1, "Host company is required"),
    hostCompanyLogo: z.string().optional(),
    eventLocation: z.string().min(1, "Event location is required"),
    additionalDetailsUrl: z.string().url("Invalid details URL"),
    registrationUrl: z.string().url("Invalid registration URL").optional(),
    authorId: z.string(),
  }),
  // Blog Post Schema
  z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    category: z.literal(PostCategory.BLOG_POSTS),
    imageUrl: z.string().optional(),
    publishDate: z.string().min(1, "Publish date is required"),
    author: z.string().min(1, "Author is required"),
    url: z.string().url("Invalid URL"),
    authorId: z.string(),
  }),
  // Book Post Schema
  z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Book description is required"),
    category: z.literal(PostCategory.BOOKS),
    coverImage: z.string().optional(),
    authorName: z.string().min(1, "Author name is required"),
    purchaseUrl: z.string().url("Invalid purchase URL"),
    authorId: z.string(),
  }),
  // Course Post Schema
  z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    category: z.literal(PostCategory.COURSES),
    companyLogo: z.string().optional(),
    courseImage: z.string().optional(),
    courseUrl: z.string().url("Invalid course URL"),
    signUpUrl: z.string().url("Invalid sign up URL"),
    authorId: z.string(),
  }),
]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Verify the author ID matches the session user
    if (validatedData.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid author ID" },
        { status: 403 }
      );
    }

    // Prepare metadata based on post category
    let metadata = {};
    if (
      validatedData.category === PostCategory.THOUGHT_LEADERSHIP &&
      validatedData.videoSource
    ) {
      metadata = { videoSource: validatedData.videoSource };
    } else if (validatedData.category === PostCategory.NEWS) {
      metadata = {
        imageCaption: validatedData.imageCaption,
        sourceUrl: validatedData.sourceUrl,
      };
    } else if (validatedData.category === PostCategory.EVENTS) {
      metadata = {
        eventStartDate: validatedData.eventStartDate,
        eventEndDate: validatedData.eventEndDate,
        eventLocation: validatedData.eventLocation,
        hostCompany: validatedData.hostCompany,
        hostCompanyLogo: validatedData.hostCompanyLogo,
        additionalDetailsUrl: validatedData.additionalDetailsUrl,
        registrationUrl: validatedData.registrationUrl,
      };
    } else if (validatedData.category === PostCategory.BLOG_POSTS) {
      metadata = {
        publishDate: validatedData.publishDate,
        author: validatedData.author,
        url: validatedData.url,
      };
    } else if (validatedData.category === PostCategory.BOOKS) {
      metadata = {
        authorName: validatedData.authorName,
        purchaseUrl: validatedData.purchaseUrl,
      };
    } else if (validatedData.category === PostCategory.COURSES) {
      metadata = {
        companyLogo: validatedData.companyLogo,
        courseImage: validatedData.courseImage,
        courseUrl: validatedData.courseUrl,
        signUpUrl: validatedData.signUpUrl,
      };
    }

    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        authorId: validatedData.authorId,
        featuredImage:
          validatedData.category === PostCategory.BOOKS
            ? validatedData.coverImage
            : "imageUrl" in validatedData
            ? validatedData.imageUrl
            : null,
        videoUrl: "videoUrl" in validatedData ? validatedData.videoUrl : null,
        metadata,
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        category: true,
        createdAt: true,
        featuredImage: true,
        videoUrl: true,
        metadata: true,
        upvoteCount: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            businessName: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POSTS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const categoriesParam = searchParams.get("categories");
    const categories = categoriesParam?.split(",") as
      | PostCategory[]
      | undefined;
    const limit = Number(searchParams.get("limit")) || POSTS_PER_PAGE;

    const posts = await prisma.post.findMany({
      take: limit + 1, // take an extra item to determine if there are more items
      ...(cursor && {
        skip: 1, // Skip the cursor
        cursor: {
          id: cursor,
        },
      }),
      where: {
        ...(categories?.length && {
          category: {
            in: categories,
          },
        }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        category: true,
        createdAt: true,
        featuredImage: true,
        videoUrl: true,
        metadata: true,
        upvoteCount: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            businessName: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      items: posts,
      nextCursor,
    });
  } catch (error) {
    console.error("[POSTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
