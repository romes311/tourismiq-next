import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const post = await prisma.post.update({
      where: { id: params.postId },
      data: {
        upvoteCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ upvoted: true, upvoteCount: post.upvoteCount });
  } catch (error) {
    console.error("[UPVOTE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const post = await prisma.post.update({
      where: { id: params.postId },
      data: {
        upvoteCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ upvoted: false, upvoteCount: post.upvoteCount });
  } catch (error) {
    console.error("[UPVOTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
