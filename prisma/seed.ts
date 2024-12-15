import { PrismaClient, PostCategory, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getPlaceholderImage(seed: number): string {
  // Using Lorem Picsum with specific dimensions and a seed for consistent images
  return `https://picsum.photos/seed/${seed}/1200/630`;
}

function generateRandomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

interface SeedUsers {
  founder: User;
  vendor: User;
  admin: User;
}

function generateMorePosts(users: SeedUsers) {
  const startDate = new Date("2023-01-01");
  const endDate = new Date();
  const categories = Object.values(PostCategory);
  const posts = [];

  // Generate 50 additional posts with random dates
  for (let i = 0; i < 50; i++) {
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const randomUser = [users.founder, users.vendor, users.admin][
      Math.floor(Math.random() * 3)
    ];
    const randomDate = generateRandomDate(startDate, endDate);

    posts.push({
      title: `${randomCategory} Post #${i + 1}`,
      content: `This is a sample ${randomCategory.toLowerCase()} post #${
        i + 1
      } created on ${randomDate.toLocaleDateString()}.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Key Points:
1. Industry Impact
2. Future Trends
3. Best Practices
4. Case Studies

This post explores various aspects of ${randomCategory
        .toLowerCase()
        .replace(/_/g, " ")} in the tourism industry.`,
      summary: `A comprehensive look at ${randomCategory
        .toLowerCase()
        .replace(/_/g, " ")} in tourism - Post #${i + 1}`,
      category: randomCategory,
      published: true,
      createdAt: randomDate,
      updatedAt: randomDate,
      featuredImage: getPlaceholderImage(i + 1),
      authorId: randomUser.id,
      tags: {
        create: [
          { name: `tag-${i}-1` },
          { name: `tag-${i}-2` },
          { name: `${randomCategory.toLowerCase()}-${i}` },
        ],
      },
    });
  }

  return posts;
}

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@tourismiq.com",
      name: "Admin User",
      password: adminPassword,
      role: Role.ADMIN,
      profile: {
        create: {
          bio: "Platform administrator",
          occupation: "System Administrator",
        },
      },
    },
  });

  // Create a founder user
  const founderPassword = await bcrypt.hash("founder123", 10);
  const founder = await prisma.user.create({
    data: {
      email: "founder@tourismiq.com",
      name: "Sarah Chen",
      password: founderPassword,
      role: Role.FOUNDER,
      profile: {
        create: {
          bio: "Tourism industry veteran with 15+ years of experience",
          occupation: "Tourism Consultant",
          location: "Singapore",
          website: "https://example.com/sarah",
        },
      },
    },
  });

  // Create a vendor user
  const vendorPassword = await bcrypt.hash("vendor123", 10);
  const vendor = await prisma.user.create({
    data: {
      email: "vendor@tourismiq.com",
      name: "Michael Torres",
      password: vendorPassword,
      role: Role.VENDOR,
      businessName: "EcoAdventures Ltd",
      businessType: "Tour Operator",
      profile: {
        create: {
          bio: "Specializing in sustainable eco-tourism experiences",
          occupation: "Tour Operator",
          location: "Costa Rica",
          website: "https://example.com/ecoadventures",
        },
      },
    },
  });

  // Generate posts with random dates
  const posts = generateMorePosts({ founder, vendor, admin });

  // Create all posts
  for (const post of posts) {
    await prisma.post.create({
      data: post,
    });
  }

  // Create some follows relationships
  await prisma.follows.create({
    data: {
      followerId: vendor.id,
      followingId: founder.id,
    },
  });

  await prisma.follows.create({
    data: {
      followerId: admin.id,
      followingId: founder.id,
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
