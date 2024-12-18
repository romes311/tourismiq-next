import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const paramsSchema = z.object({
  userId: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate and parse params
    const { userId } = paramsSchema.parse(await Promise.resolve(params));

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("Current session:", session);

    if (!session?.user?.id || session.user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Validate file
    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse("File size too large (max 4MB)", { status: 400 });
    }

    // Check file type
    if (!VALID_MIME_TYPES.includes(file.type)) {
      return new NextResponse(
        "Invalid file type. Please upload a JPG, PNG, or WebP image",
        { status: 400 }
      );
    }

    // Create a unique filename with the correct extension
    const timestamp = Date.now();
    const extension = file.type.split("/")[1];
    const filename = `profile-${userId}-${timestamp}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save the file to public/uploads
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Update the user's profile image in the database
    const imageUrl = `/uploads/${filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    // Trigger Pusher event for real-time update
    await pusherServer.trigger("user-updates", `profile-update-${userId}`, {
      type: "PROFILE_IMAGE_UPDATE",
      user: updatedUser,
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error in profile image upload:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
