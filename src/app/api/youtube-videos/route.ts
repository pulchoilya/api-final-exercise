import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const videos = await prisma.youTubeVideo.findMany({
    where: { isPublished: true },
    orderBy: { position: 'asc' },
  });
  return NextResponse.json(videos);
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { title, videoId, description, position, isPublished } =
    await req.json();

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return NextResponse.json(
      { error: 'Title must be at least 2 characters' },
      { status: 400 },
    );
  }

  if (!videoId || typeof videoId !== 'string' || videoId.trim().length < 2) {
    return NextResponse.json(
      { error: 'YouTube video ID is required' },
      { status: 400 },
    );
  }

  const video = await prisma.youTubeVideo.create({
    data: {
      title: title.trim(),
      videoId: videoId.trim(),
      description: description?.trim() || null,
      position: position ?? 0,
      isPublished: isPublished ?? false,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
