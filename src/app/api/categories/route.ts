import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { name } = await req.json();

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Name must be at least 2 characters' },
      { status: 400 },
    );
  }

  const slug = slugify(name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: 'Category already exists' },
      { status: 409 },
    );
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), slug },
  });

  return NextResponse.json(category, { status: 201 });
}
