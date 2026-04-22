import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const databaseUrl = process.env.DATABASE_URL!;
const dbUrl = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Password1', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dojo.api' },
    update: {},
    create: {
      email: 'admin@dojo.api',
      name: 'Admin User',
      hashedPassword: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user: ${admin.email} (password: Password1)`);

  // ─── Regular User ─────────────────────────────────────────
  const userPassword = await bcrypt.hash('Password1', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@dojo.api' },
    update: {},
    create: {
      email: 'user@dojo.api',
      name: 'Test User',
      hashedPassword: userPassword,
      role: 'USER',
    },
  });
  console.log(`✅ Test user: ${user.email} (password: Password1)`);

  // ─── OAuth Client ─────────────────────────────────────────
  const clientId = 'client_test_app';
  const clientSecretPlain = 'test-secret-do-not-use-in-production';
  const clientSecretHashed = await bcrypt.hash(clientSecretPlain, 12);

  await prisma.oAuthClient.upsert({
    where: { clientId },
    update: {},
    create: {
      clientId,
      clientSecret: clientSecretHashed,
      name: 'Test Application',
      grants: JSON.stringify(['client_credentials', 'refresh_token']),
      scopes: JSON.stringify(['read', 'write']),
    },
  });
  console.log(`✅ OAuth client: ${clientId} (secret: ${clientSecretPlain})`);

  // ─── Categories ───────────────────────────────────────────
  const categories = await Promise.all(
    [
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Mobile Development', slug: 'mobile-development' },
      { name: 'DevOps', slug: 'devops' },
      { name: 'Data Science', slug: 'data-science' },
    ].map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      }),
    ),
  );
  console.log(`✅ ${categories.length} categories`);

  // ─── Courses with Chapters ────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { slug: 'introduction-to-typescript' },
    update: {},
    create: {
      title: 'Introduction to TypeScript',
      slug: 'introduction-to-typescript',
      description:
        'Learn TypeScript from scratch. This course covers types, interfaces, generics, and advanced patterns.',
      imageUrl: 'https://picsum.photos/seed/ts/800/400',
      price: 29.99,
      isPublished: true,
      authorName: 'Admin User',
      authorRole: 'Senior Developer',
      outcomes: JSON.stringify([
        'Understand TypeScript type system',
        'Use generics effectively',
        'Build type-safe APIs',
      ]),
      requirements: JSON.stringify([
        'Basic JavaScript knowledge',
        'Node.js installed',
      ]),
      categories: { connect: [{ id: categories[0].id }] },
    },
  });

  const chapters1 = [
    { title: 'Getting Started', position: 1, isPublished: true, isFree: true },
    { title: 'Basic Types', position: 2, isPublished: true, isFree: false },
    {
      title: 'Interfaces & Types',
      position: 3,
      isPublished: true,
      isFree: false,
    },
    { title: 'Generics', position: 4, isPublished: true, isFree: false },
    {
      title: 'Advanced Patterns',
      position: 5,
      isPublished: false,
      isFree: false,
    },
  ];

  for (const ch of chapters1) {
    await prisma.chapter.upsert({
      where: {
        id: `seed-ch-${course1.id}-${ch.position}`,
      },
      update: {},
      create: {
        id: `seed-ch-${course1.id}-${ch.position}`,
        ...ch,
        courseId: course1.id,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        notes: `# ${ch.title}\n\nLesson notes for ${ch.title}.`,
      },
    });
  }
  console.log(`✅ Course: ${course1.title} (${chapters1.length} chapters)`);

  const course2 = await prisma.course.upsert({
    where: { slug: 'nextjs-api-development' },
    update: {},
    create: {
      title: 'Next.js API Development',
      slug: 'nextjs-api-development',
      description:
        'Build production-ready REST APIs with Next.js App Router, Prisma, and OAuth2.',
      imageUrl: 'https://picsum.photos/seed/nextjs/800/400',
      price: 49.99,
      isPublished: true,
      authorName: 'Admin User',
      authorRole: 'Full-Stack Developer',
      categories: { connect: [{ id: categories[0].id }] },
    },
  });

  for (let i = 1; i <= 3; i++) {
    await prisma.chapter.upsert({
      where: { id: `seed-ch-${course2.id}-${i}` },
      update: {},
      create: {
        id: `seed-ch-${course2.id}-${i}`,
        title: `Chapter ${i}`,
        position: i,
        isPublished: true,
        isFree: i === 1,
        courseId: course2.id,
      },
    });
  }
  console.log(`✅ Course: ${course2.title} (3 chapters)`);

  // ─── Promo Codes ──────────────────────────────────────────
  await prisma.promoCode.upsert({
    where: { code: 'WELCOME100' },
    update: {},
    create: {
      code: 'WELCOME100',
      courseId: course1.id,
      discountPercent: 100,
      maxUses: 50,
      expiresAt: new Date('2027-12-31'),
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'HALF-OFF' },
    update: {},
    create: {
      code: 'HALF-OFF',
      courseId: course2.id,
      discountPercent: 50,
      expiresAt: new Date('2027-06-30'),
    },
  });
  console.log('✅ 2 promo codes (WELCOME100, HALF-OFF)');

  // ─── Tags & Posts ─────────────────────────────────────────
  const tags = await Promise.all(
    [
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Next.js', slug: 'nextjs' },
      { name: 'Tutorial', slug: 'tutorial' },
    ].map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      }),
    ),
  );

  await prisma.post.upsert({
    where: { slug: 'getting-started-with-typescript' },
    update: {},
    create: {
      title: 'Getting Started with TypeScript',
      slug: 'getting-started-with-typescript',
      excerpt: 'A beginner-friendly guide to TypeScript.',
      content:
        '# Getting Started with TypeScript\n\nTypeScript adds static types to JavaScript...',
      isPublished: true,
      publishedAt: new Date(),
      tags: { connect: [{ id: tags[0].id }, { id: tags[2].id }] },
    },
  });
  console.log(`✅ ${tags.length} tags, 1 post`);

  // ─── YouTube Videos ───────────────────────────────────────
  await prisma.youTubeVideo.upsert({
    where: { id: 'seed-video-1' },
    update: {},
    create: {
      id: 'seed-video-1',
      title: 'Dojo API Introduction',
      videoId: 'dQw4w9WgXcQ',
      description: 'Introduction to the Dojo API platform',
      position: 1,
      isPublished: true,
    },
  });
  console.log('✅ 1 YouTube video');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Quick start:');
  console.log('  1. POST /api/auth/register — or use seeded admin@dojo.api');
  console.log(
    '  2. POST /api/oauth/token — { grant_type: "password", email: "admin@dojo.api", password: "Password1" }',
  );
  console.log('  3. Use the access_token as Bearer token');
  console.log('  4. Visit /api/docs for interactive Swagger UI');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
