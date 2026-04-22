import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { postId } = await params;
  const values = await req.json();

  if (values.title) {
    let slug = slugify(values.title);
    const existing = await prisma.post.findFirst({
      where: { slug, NOT: { id: postId } },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    values.slug = slug;
  }

  const { tagIds, ...rest } = values;
  const data: Record<string, unknown> = { ...rest };
  if (Array.isArray(tagIds)) {
    data.tags = { set: tagIds.map((id: string) => ({ id })) };
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data,
    include: { tags: true },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { postId } = await params;

  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ success: true });
}
