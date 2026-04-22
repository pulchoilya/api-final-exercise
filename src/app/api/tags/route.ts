import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(tags);
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

  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
  }

  const tag = await prisma.tag.create({
    data: { name: name.trim(), slug },
  });

  return NextResponse.json(tag, { status: 201 });
}
