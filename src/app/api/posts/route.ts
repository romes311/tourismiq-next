import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PostCategory } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const POSTS_PER_PAGE = 5;

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.nativeEnum(PostCategory),
  mediaType: z.enum(["image", "video"]),
  imageUrl: z.string().optional(),
  videoSource: z.enum(["youtube", "vimeo", "twitter", "linkedin"]).optional(),
  videoUrl: z.string().optional(),
  authorId: z.string(),
});

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

    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        authorId: validatedData.authorId,
        featuredImage: validatedData.imageUrl,
        videoUrl: validatedData.videoUrl,
        metadata: validatedData.videoSource
          ? { videoSource: validatedData.videoSource }
          : undefined,
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
