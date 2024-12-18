import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
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
    const path = join(process.cwd(), "public", "uploads", filename);
    await writeFile(path, buffer);

    // Update the user's profile image in the database
    const imageUrl = `/uploads/${filename}`;
    console.log("Updating user image to:", imageUrl);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    console.log("Updated user:", updatedUser);

    // Return both the image URL and the updated user data
    return NextResponse.json({
      imageUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return new NextResponse("Error uploading image", { status: 500 });
  }
}
