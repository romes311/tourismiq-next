import { PrismaClient, PostCategory, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getPlaceholderImage(seed: number): string {
  return `https://picsum.photos/seed/${seed}/1200/630`;
}

async function main() {
  console.log("Starting seed process...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@tourismiq.com",
      name: "Admin User",
      role: Role.ADMIN,
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "Platform administrator",
          occupation: "System Administrator",
          interests: [],
        },
      },
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: "admin@tourismiq.com",
          password: adminPassword,
        },
      },
    },
  });
  console.log("Admin user created:", admin.id);

  // Create test user
  const testPassword = await bcrypt.hash("test123", 10);
  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      role: Role.USER,
      emailVerified: new Date(),
      businessName: "Test Company",
      profile: {
        create: {
          bio: "This is a test bio",
          location: "San Francisco, CA",
          occupation: "Software Engineer",
          interests: ["tourism", "technology"],
        },
      },
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: "test@example.com",
          password: testPassword,
        },
      },
    },
  });
  console.log("Test user created:", testUser.id);

  // Create sample posts
  const posts = [
    // Thought Leadership Posts
    {
      title: "The Future of Tourism Technology",
      content:
        "An in-depth analysis of emerging trends in tourism technology...",
      summary: "Exploring the intersection of tourism and technology",
      category: PostCategory.THOUGHT_LEADERSHIP,
      featuredImage: getPlaceholderImage(1),
      authorId: admin.id,
      tags: ["technology", "future", "trends"],
    },
    {
      title: "Sustainable Tourism Practices",
      content: "How sustainable practices are shaping the future of tourism...",
      summary: "A comprehensive guide to sustainable tourism",
      category: PostCategory.THOUGHT_LEADERSHIP,
      featuredImage: getPlaceholderImage(2),
      authorId: testUser.id,
      tags: ["sustainability", "eco-tourism"],
    },

    // News Posts
    {
      title: "Tourism Industry Recovery Post-Pandemic",
      content: "Latest statistics show promising recovery in tourism sector...",
      summary: "Industry recovery trends and statistics",
      category: PostCategory.NEWS,
      featuredImage: getPlaceholderImage(3),
      authorId: admin.id,
      metadata: {
        sourceUrl: "https://example.com/news",
        imageCaption: "Tourism growth chart 2023",
      },
      tags: ["recovery", "statistics", "growth"],
    },

    // Events
    {
      title: "International Tourism Conference 2024",
      content: "Join us for the biggest tourism conference of the year...",
      category: PostCategory.EVENTS,
      featuredImage: getPlaceholderImage(4),
      authorId: admin.id,
      metadata: {
        eventStartDate: new Date("2024-06-15T09:00:00Z"),
        eventEndDate: new Date("2024-06-17T17:00:00Z"),
        eventLocation: "Las Vegas Convention Center",
        hostCompany: "TourismIQ",
        registrationUrl: "https://example.com/register",
      },
      tags: ["conference", "networking"],
    },

    // Blog Posts
    {
      title: "Top 10 Tourism Marketing Strategies",
      content: "Effective marketing strategies for tourism businesses...",
      category: PostCategory.BLOG_POSTS,
      featuredImage: getPlaceholderImage(5),
      authorId: testUser.id,
      metadata: {
        author: "Marketing Expert",
        publishDate: new Date("2023-12-01"),
        url: "https://example.com/blog",
      },
      tags: ["marketing", "strategies"],
    },

    // Courses
    {
      title: "Digital Marketing for Tourism",
      content:
        "Learn how to market your tourism business effectively online...",
      category: PostCategory.COURSES,
      featuredImage: getPlaceholderImage(6),
      authorId: admin.id,
      metadata: {
        courseUrl: "https://example.com/course",
        signUpUrl: "https://example.com/signup",
        companyLogo: getPlaceholderImage(7),
      },
      tags: ["education", "digital-marketing"],
    },

    // Podcasts
    {
      title: "Tourism Industry Insights Podcast",
      content: "Weekly discussions about the tourism industry...",
      category: PostCategory.PODCASTS,
      featuredImage: getPlaceholderImage(8),
      authorId: testUser.id,
      metadata: {
        podcastUrl: "https://example.com/podcast",
        podcastHost: "Industry Expert",
      },
      tags: ["podcast", "insights"],
    },

    // Presentations
    {
      title: "Future of Travel Technology",
      content: "A presentation on emerging travel technologies...",
      category: PostCategory.PRESENTATIONS,
      featuredImage: getPlaceholderImage(9),
      authorId: admin.id,
      metadata: {
        presentationDate: new Date("2024-01-15"),
        presentationVenue: "Tech Conference Center",
      },
      tags: ["technology", "presentation"],
    },

    // Templates
    {
      title: "Tourism Business Plan Template",
      content: "A comprehensive business plan template for tourism ventures...",
      category: PostCategory.TEMPLATES,
      featuredImage: getPlaceholderImage(10),
      authorId: admin.id,
      metadata: {
        templateFileUrl: "https://example.com/template",
        templateFileType: "PDF",
      },
      tags: ["business", "planning"],
    },

    // Case Studies
    {
      title: "Successful Tourism Marketing Campaign",
      content: "A case study of a successful tourism marketing campaign...",
      category: PostCategory.CASE_STUDIES,
      featuredImage: getPlaceholderImage(11),
      authorId: testUser.id,
      metadata: {
        caseStudyCompany: "Tourism Success Ltd",
        caseStudyIndustry: "Destination Marketing",
      },
      tags: ["case-study", "marketing"],
    },

    // Whitepapers
    {
      title: "The Impact of AI on Tourism",
      content: "An analysis of how AI is transforming the tourism industry...",
      category: PostCategory.WHITEPAPERS,
      featuredImage: getPlaceholderImage(12),
      authorId: admin.id,
      metadata: {
        whitepaperFileUrl: "https://example.com/whitepaper",
        whitepaperTopics: ["AI", "Technology", "Tourism"],
      },
      tags: ["AI", "research"],
    },

    // Jobs
    {
      title: "Tourism Marketing Manager",
      content: "We're looking for an experienced Tourism Marketing Manager...",
      category: PostCategory.JOBS,
      authorId: testUser.id,
      metadata: {
        company: "Tourism Enterprise",
        location: "New York, NY",
        salary: "$80,000 - $100,000",
      },
      tags: ["jobs", "marketing", "management"],
    },
  ];

  console.log("Creating sample posts...");
  let createdPosts = 0;
  // Create all posts
  for (const post of posts) {
    try {
      await prisma.post.create({
        data: {
          ...post,
          published: true,
          tags: {
            connectOrCreate: post.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      });
      createdPosts++;
    } catch (error) {
      console.error(`Failed to create post: ${post.title}`, error);
    }
  }
  console.log(`Created ${createdPosts} sample posts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
