import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    include: { tags: true },
    orderBy: { publishedAt: 'desc' },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { title, excerpt, content, imageUrl, tagIds, isPublished } =
    await req.json();

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return NextResponse.json(
      { error: 'Title must be at least 3 characters' },
      { status: 400 },
    );
  }

  let slug = slugify(title);
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      slug,
      excerpt: excerpt?.trim() || null,
      content: content || null,
      imageUrl: imageUrl || null,
      isPublished: isPublished ?? false,
      publishedAt: isPublished ? new Date() : null,
      ...(Array.isArray(tagIds) && tagIds.length > 0
        ? { tags: { connect: tagIds.map((id: string) => ({ id })) } }
        : {}),
    },
    include: { tags: true },
  });

  return NextResponse.json(post, { status: 201 });
}
