import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const upvoteSchema = z.object({
  postId: z.string(),
  action: z.enum(["upvote", "remove"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, action } = upvoteSchema.parse(body);

    // First get the current post to check upvote count
    const currentPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, upvoteCount: true },
    });

    if (!currentPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Prevent negative upvote counts
    if (action === "remove" && currentPost.upvoteCount === 0) {
      return Response.json(
        { error: "Cannot remove upvote from zero" },
        { status: 400 }
      );
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        upvoteCount: {
          [action === "upvote" ? "increment" : "decrement"]: 1,
        },
      },
      select: {
        id: true,
        upvoteCount: true,
      },
    });

    return Response.json(post);
  } catch (error) {
    return Response.json(
      {
        error: "Failed to update upvote",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
