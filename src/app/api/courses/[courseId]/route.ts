import { NextResponse } from 'next/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const auth = await getAuthUser(req);
  const isAdmin = auth?.role === 'ADMIN';

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      categories: true,
      chapters: {
        where: isAdmin ? undefined : { isPublished: true },
        orderBy: { position: 'asc' },
      },
      attachments: true,
    },
  });

  if (!course || (!isAdmin && !course.isPublished)) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  return NextResponse.json(course);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { courseId } = await params;
  const values = await req.json();

  if (values.title) {
    let slug = slugify(values.title);
    const existing = await prisma.course.findFirst({
      where: { slug, NOT: { id: courseId } },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    values.slug = slug;
  }

  const { categoryIds, outcomes, requirements, ...rest } = values;
  const data: Record<string, unknown> = { ...rest };
  if (Array.isArray(categoryIds)) {
    data.categories = {
      set: categoryIds.map((id: string) => ({ id })),
    };
  }
  if (Array.isArray(outcomes)) {
    data.outcomes = outcomes.length > 0 ? JSON.stringify(outcomes) : null;
  }
  if (Array.isArray(requirements)) {
    data.requirements =
      requirements.length > 0 ? JSON.stringify(requirements) : null;
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data,
  });

  return NextResponse.json(course);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { courseId } = await params;

  await prisma.course.delete({ where: { id: courseId } });

  return NextResponse.json({ success: true });
}
