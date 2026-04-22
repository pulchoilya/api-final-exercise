import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

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

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { chapters: { where: { isPublished: true } } },
  });

  if (!course) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (
    !course.title ||
    !course.description ||
    !course.imageUrl ||
    !course.price
  ) {
    return NextResponse.json(
      { error: 'Missing required fields (title, description, image, price)' },
      { status: 400 },
    );
  }

  if (course.chapters.length === 0) {
    return NextResponse.json(
      { error: 'At least one published chapter is required' },
      { status: 400 },
    );
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { isPublished: !course.isPublished },
  });

  return NextResponse.json(updated);
}
