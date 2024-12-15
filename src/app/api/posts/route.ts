import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const POSTS_PER_PAGE = 5;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Number(searchParams.get("limit")) || POSTS_PER_PAGE;

    const posts = await prisma.post.findMany({
      take: limit + 1, // take an extra item to determine if there are more items
      ...(cursor && {
        skip: 1, // Skip the cursor
        cursor: {
          id: cursor,
        },
      }),
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        category: true,
        createdAt: true,
        featuredImage: true,
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
