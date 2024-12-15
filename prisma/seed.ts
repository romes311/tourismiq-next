import { PrismaClient, PostCategory, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  // Create example posts for different categories
  const posts = [
    // Thought Leadership Post
    {
      title: "The Future of Sustainable Tourism in 2024",
      content: `As we enter 2024, the tourism industry stands at a crucial crossroads. The convergence of technology, sustainability, and changing traveler preferences is reshaping how we think about and experience travel.

Key Trends:
1. Rise of Regenerative Tourism
2. Technology-Enhanced Experiences
3. Community-First Approaches
4. Sustainable Transportation
5. Cultural Preservation Initiatives

The future of tourism lies not just in minimizing our impact, but in actively contributing to the destinations we visit.`,
      summary: "Exploring emerging trends in sustainable tourism",
      category: PostCategory.THOUGHT_LEADERSHIP,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613",
      authorId: founder.id,
      tags: {
        create: [
          { name: "tourism-future" },
          { name: "sustainability-trends" },
          { name: "industry-analysis" },
        ],
      },
    },

    // Course Post
    {
      title: "Sustainable Tourism Management Certificate",
      content: `Comprehensive online course covering all aspects of sustainable tourism management. Perfect for tourism professionals looking to implement sustainable practices in their operations.

Course Modules:
- Introduction to Sustainable Tourism
- Environmental Impact Assessment
- Community Engagement Strategies
- Sustainable Business Models
- Marketing Eco-Friendly Tourism
- Certification and Compliance`,
      summary: "Professional certification in sustainable tourism management",
      category: PostCategory.COURSES,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      authorId: founder.id,
      courseInstructor: "Sarah Chen",
      courseDuration: "6 weeks",
      courseSkillLevel: "Intermediate",
      coursePlatform: "TourismIQ Learning",
      tags: {
        create: [
          { name: "tourism-education" },
          { name: "professional-cert" },
          { name: "skill-development" },
        ],
      },
    },

    // Case Study Post
    {
      title: "EcoAdventures: Transforming Local Tourism in Costa Rica",
      content: `A comprehensive case study on how EcoAdventures revolutionized local tourism in Costa Rica through sustainable practices and community engagement.

Challenge:
Balancing tourism growth with environmental preservation and local community benefits.

Solution:
Implementation of a community-first approach with sustainable practices:
- Local guide training program
- Waste reduction initiatives
- Community profit-sharing model
- Cultural preservation projects

Results:
- 50% reduction in environmental impact
- 200% increase in local employment
- 85% positive community feedback
- 30% increase in tourist satisfaction`,
      summary: "Success story of sustainable tourism implementation",
      category: PostCategory.CASE_STUDIES,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5",
      authorId: vendor.id,
      caseStudyCompany: "EcoAdventures Ltd",
      caseStudyIndustry: "Eco-Tourism",
      tags: {
        create: [
          { name: "case-study-eco" },
          { name: "success-stories" },
          { name: "eco-tourism-examples" },
        ],
      },
    },

    // Event Post
    {
      title: "International Tourism Summit 2024",
      content: `Join us for the biggest tourism industry event of the year! The International Tourism Summit 2024 brings together industry leaders, innovators, and professionals for three days of networking, learning, and collaboration.

Event Highlights:
- Keynote speakers from leading travel companies
- Interactive workshops and panel discussions
- Networking opportunities
- Latest industry trends and insights`,
      summary: "Annual gathering of tourism industry professionals",
      category: PostCategory.EVENTS,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
      authorId: admin.id,
      eventDate: new Date("2024-06-15T09:00:00Z"),
      eventLocation: "Singapore Convention Center",
      eventRegistrationUrl: "https://example.com/register",
      tags: {
        create: [
          { name: "tourism-events" },
          { name: "industry-conference" },
          { name: "networking-2024" },
        ],
      },
    },

    // Whitepaper Post
    {
      title: "The Economic Impact of Sustainable Tourism",
      content: `A comprehensive analysis of how sustainable tourism practices affect local economies, environmental preservation, and community development.

Key Findings:
1. Economic Benefits
- Direct revenue generation
- Job creation
- Infrastructure development

2. Environmental Impact
- Resource conservation
- Biodiversity protection
- Carbon footprint reduction

3. Social Benefits
- Cultural preservation
- Community empowerment
- Education opportunities

4. Long-term Sustainability
- Business model viability
- Scalability considerations
- Future growth potential`,
      summary: "Research paper on sustainable tourism economics",
      category: PostCategory.WHITEPAPERS,
      published: true,
      authorId: founder.id,
      whitepaperFileUrl: "https://example.com/whitepaper.pdf",
      whitepaperTopics: ["Economics", "Sustainability", "Tourism Development"],
      tags: {
        create: [
          { name: "tourism-research" },
          { name: "economic-impact" },
          { name: "whitepaper-2024" },
        ],
      },
    },

    // NEWS Post
    {
      title: "Tourism Industry Rebounds with Record Growth in Q4 2023",
      content: `Latest industry reports show unprecedented recovery in the tourism sector, with Q4 2023 numbers surpassing pre-pandemic levels in many regions.

Key Statistics:
- International arrivals up 25% YoY
- Hotel occupancy rates reach 85%
- Average tourist spending increased by 15%
- Sustainable tourism initiatives driving growth

Industry experts attribute this success to pent-up demand and innovative adaptation by tourism businesses.`,
      summary: "Tourism sector shows strong recovery in latest quarter",
      category: PostCategory.NEWS,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05",
      authorId: admin.id,
      pressSource: "Tourism Industry Weekly",
      tags: {
        create: [
          { name: "tourism-news" },
          { name: "industry-recovery" },
          { name: "market-statistics" },
        ],
      },
    },

    // BLOG_POSTS Post
    {
      title: "5 Hidden Gems in Southeast Asia for 2024",
      content: `Discover these lesser-known destinations that offer authentic experiences away from the usual tourist trails.

1. Kampong Ayer, Brunei
The world's largest water village offers a unique glimpse into traditional life.

2. Phong Nha, Vietnam
Home to some of the world's most spectacular caves and pristine forests.

3. Bantayan Island, Philippines
Crystal clear waters and unspoiled beaches without the crowds.

4. Hsipaw, Myanmar
Ancient temples and stunning hiking trails in the Shan State.

5. Koh Rong Samloem, Cambodia
A peaceful alternative to popular coastal destinations.`,
      summary: "Exploring undiscovered destinations in Southeast Asia",
      category: PostCategory.BLOG_POSTS,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1528181304800-259b08848526",
      authorId: vendor.id,
      tags: {
        create: [
          { name: "destination-tips" },
          { name: "asia-travel" },
          { name: "off-beaten-path" },
        ],
      },
    },

    // BOOKS Post
    {
      title: "The Future of Sustainable Tourism: A Comprehensive Guide",
      content: `This groundbreaking book explores the intersection of sustainability and tourism, offering practical guidelines for industry professionals and policymakers.

Chapters include:
1. Understanding Sustainable Tourism
2. Environmental Impact Assessment
3. Community Engagement
4. Economic Sustainability
5. Future Trends and Technologies
6. Case Studies and Success Stories`,
      summary: "A comprehensive guide to sustainable tourism practices",
      category: PostCategory.BOOKS,
      published: true,
      featuredImage:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
      authorId: founder.id,
      bookAuthor: "Sarah Chen",
      bookISBN: "978-3-16-148410-0",
      bookPublisher: "Tourism Press",
      bookPublishDate: new Date("2024-01-01"),
      tags: {
        create: [
          { name: "tourism-books" },
          { name: "industry-guide" },
          { name: "learning-resources" },
        ],
      },
    },

    // PODCASTS Post
    {
      title: "The Tourism Revolution Podcast - Episode 1",
      content: `Join us for our inaugural episode featuring industry leaders discussing the future of travel and tourism.

Topics covered:
- The impact of AI on travel planning
- Sustainable tourism initiatives
- Changes in traveler preferences
- Emerging destinations for 2024

Guest: Maria Rodriguez, CEO of EcoTravel International`,
      summary: "Weekly discussions about the future of tourism",
      category: PostCategory.PODCASTS,
      published: true,
      authorId: founder.id,
      podcastHost: "Sarah Chen",
      podcastUrl: "https://example.com/podcast/1",
      podcastPlatforms: ["Spotify", "Apple Podcasts", "Google Podcasts"],
      tags: {
        create: [
          { name: "tourism-podcast" },
          { name: "industry-talks" },
          { name: "expert-interviews" },
        ],
      },
    },

    // PRESENTATIONS Post
    {
      title: "Revolutionizing Customer Experience in Tourism",
      content: `A comprehensive presentation on enhancing customer experience in the tourism industry through technology and personalization.

Key Points:
1. Understanding modern traveler expectations
2. Leveraging data analytics
3. Implementing AI-driven solutions
4. Creating personalized experiences
5. Measuring and improving satisfaction`,
      summary: "Strategies for enhancing tourist experiences",
      category: PostCategory.PRESENTATIONS,
      published: true,
      authorId: founder.id,
      presentationVenue: "World Tourism Forum",
      presentationDate: new Date("2024-03-15T14:00:00Z"),
      tags: {
        create: [
          { name: "tourism-presentations" },
          { name: "cx-strategies" },
          { name: "industry-innovation" },
        ],
      },
    },

    // PRESS_RELEASES Post
    {
      title: "TourismIQ Launches Revolutionary Sustainable Tourism Initiative",
      content: `TourismIQ, the leading platform for tourism professionals, announces a groundbreaking initiative to promote sustainable tourism practices worldwide.

The program includes:
- Certification for sustainable tourism operators
- Resource center for best practices
- Community engagement platform
- Impact measurement tools

For immediate release: Contact Sarah Chen for more information.`,
      summary: "New initiative to promote sustainable tourism practices",
      category: PostCategory.PRESS_RELEASES,
      published: true,
      authorId: founder.id,
      pressSource: "TourismIQ",
      pressContactInfo: "press@tourismiq.com",
      tags: {
        create: [
          { name: "tourism-press" },
          { name: "industry-news-2024" },
          { name: "sustainability-initiative" },
        ],
      },
    },

    // TEMPLATES Post
    {
      title: "Sustainable Tourism Business Plan Template",
      content: `A comprehensive business plan template specifically designed for sustainable tourism ventures.

Sections include:
1. Executive Summary
2. Market Analysis
3. Sustainability Goals
4. Operations Plan
5. Marketing Strategy
6. Financial Projections
7. Impact Assessment`,
      summary: "Professional template for tourism business planning",
      category: PostCategory.TEMPLATES,
      published: true,
      authorId: founder.id,
      templateFileUrl: "https://example.com/templates/business-plan.docx",
      templateFileType: "docx",
      tags: {
        create: [
          { name: "tourism-templates" },
          { name: "business-tools" },
          { name: "planning-resources" },
        ],
      },
    },

    // VIDEOS Post
    {
      title: "Sustainable Tourism in Practice: A Virtual Tour",
      content: `Experience sustainable tourism in action with this virtual tour of award-winning eco-lodges and community tourism projects.

Featured Locations:
- Costa Rica Eco Lodge
- Maasai Community Tourism Project
- Thai Elephant Sanctuary
- Australian Indigenous Tourism Initiative`,
      summary: "Virtual tour of sustainable tourism projects",
      category: PostCategory.VIDEOS,
      published: true,
      authorId: vendor.id,
      videoUrl: "https://example.com/videos/sustainable-tourism-tour",
      videoDuration: 1800, // 30 minutes
      tags: {
        create: [
          { name: "tourism-videos" },
          { name: "virtual-tours" },
          { name: "visual-content" },
        ],
      },
    },

    // WEBINARS Post
    {
      title: "Digital Marketing Strategies for Tourism Businesses",
      content: `Join us for an interactive webinar on effective digital marketing strategies for tourism businesses.

Topics covered:
- Social media marketing
- Content creation
- SEO for tourism websites
- Email marketing
- Influencer partnerships
- Analytics and ROI measurement`,
      summary: "Live webinar on tourism marketing",
      category: PostCategory.WEBINARS,
      published: true,
      authorId: founder.id,
      eventDate: new Date("2024-02-20T15:00:00Z"),
      eventRegistrationUrl: "https://example.com/webinar/register",
      videoUrl: "https://example.com/webinar/live",
      videoDuration: 3600, // 1 hour
      tags: {
        create: [
          { name: "tourism-webinars" },
          { name: "digital-marketing" },
          { name: "online-learning" },
        ],
      },
    },
  ];

  // Create posts
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
