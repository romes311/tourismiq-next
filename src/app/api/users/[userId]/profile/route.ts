import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const updateProfileSchema = z.object({
  name: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  businessName: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  location: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  bio: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  occupation: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  facebook: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .pipe(z.string().url().nullable().optional()),
  twitter: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .pipe(z.string().url().nullable().optional()),
  linkedin: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .pipe(z.string().url().nullable().optional()),
  instagram: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .pipe(z.string().url().nullable().optional()),
});

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = paramsSchema.parse(
      await Promise.resolve(context.params)
    );

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive data and merge profile data
    const { password: _, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      bio: user.profile?.bio || null,
      location: user.profile?.location || null,
      website: user.profile?.website || null,
      occupation: user.profile?.occupation || null,
      interests: user.profile?.interests || [],
      socialLinks: user.profile?.socialLinks || null,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user profile:", error);

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

export async function PATCH(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = paramsSchema.parse(
      await Promise.resolve(context.params)
    );

    const json = await request.json();
    const data = updateProfileSchema.parse(json);

    // Update user data
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: data.name,
        businessName: data.businessName,
        profile: {
          upsert: {
            create: {
              bio: data.bio,
              location: data.location,
              occupation: data.occupation,
              interests: [],
              canPostCDME: false,
              socialLinks:
                data.facebook || data.twitter || data.linkedin || data.instagram
                  ? {
                      facebook: data.facebook,
                      twitter: data.twitter,
                      linkedin: data.linkedin,
                      instagram: data.instagram,
                    }
                  : null,
            },
            update: {
              bio: data.bio,
              location: data.location,
              occupation: data.occupation,
              socialLinks:
                data.facebook || data.twitter || data.linkedin || data.instagram
                  ? {
                      facebook: data.facebook,
                      twitter: data.twitter,
                      linkedin: data.linkedin,
                      instagram: data.instagram,
                    }
                  : null,
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error updating user profile:", error);

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
