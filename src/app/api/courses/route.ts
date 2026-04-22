import { NextResponse } from 'next/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function GET(req: Request) {
  const auth = await getAuthUser(req);
  const isAdmin = auth?.role === 'ADMIN';

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get('limit') ?? '20')),
  );
  const categorySlug = searchParams.get('category');
  const search = searchParams.get('search')?.trim();

  const where: Record<string, unknown> = {};
  if (!isAdmin) {
    where.isPublished = true;
  }
  if (categorySlug) {
    where.categories = { some: { slug: categorySlug } };
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        categories: true,
        _count: { select: { chapters: true, purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    data: courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { title } = await req.json();

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return NextResponse.json(
      { error: 'Title must be at least 3 characters' },
      { status: 400 },
    );
  }

  let slug = slugify(title);
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const course = await prisma.course.create({
    data: { title: title.trim(), slug },
  });

  return NextResponse.json(course, { status: 201 });
}
