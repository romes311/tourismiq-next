import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  context: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { postId } = params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get the post to check ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow the author or admin to delete the post
    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - You cannot delete this post" },
        { status: 403 }
      );
    }

    // Delete the post and its associated comments
    await prisma.$transaction([
      // Delete all comments first
      prisma.comment.deleteMany({
        where: { postId },
      }),
      // Then delete the post
      prisma.post.delete({
        where: { id: postId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
