import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const POSTS_PER_PAGE = 10;

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(POSTS_PER_PAGE),
});

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    // Validate params
    const { userId } = paramsSchema.parse(
      await Promise.resolve(context.params)
    );

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : POSTS_PER_PAGE,
    });

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        published: true,
      },
      take: query.limit + 1,
      ...(query.cursor && {
        cursor: {
          id: query.cursor,
        },
        skip: 1,
      }),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            businessName: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > query.limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      items: posts,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
