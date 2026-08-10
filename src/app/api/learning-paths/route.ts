import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    // Only admins can create learning paths
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  try {
    const payload = await req.json();

    const {
      title,
      description,
      modules = [],
      categoryIds = [],
      video,
      certificate,
      instructor
    } = payload;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters' },
        { status: 400 },
      );
    }

    if (!instructor || !instructor.name) {
        return NextResponse.json(
          { error: 'Instructor is required with at least a name' },
          { status: 400 },
        );
    }

    let slug = slugify(title);
    const existing = await prisma.learningPath.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create the LearningPath and all nested entities in a single transaction
    const learningPath = await prisma.learningPath.create({
      data: {
        title: title.trim(),
        slug,
        description,
        isPublished: false,
        // 1. Create related modules
        modules: {
          create: modules.map((m: any, index: number) => ({
            title: m.title,
            description: m.description,
            position: m.position ?? index,
          })),
        },
        // 2. Link existing categories
        categories: {
          connect: categoryIds.map((id: string) => ({ id })),
        },
        // 3. Create Video (Optional)
        ...(video && video.title && video.videoId
          ? {
              video: {
                create: {
                  title: video.title,
                  videoId: video.videoId,
                  isPublished: true,
                },
              },
            }
          : {}),
        // 4. Create Certificate (Optional)
        ...(certificate && certificate.name
          ? {
              certificate: {
                create: {
                  name: certificate.name,
                  description: certificate.description,
                  templateUrl: certificate.templateUrl,
                },
              },
            }
          : {}),
        // 5. Create Instructor
        instructor: {
          create: {
            name: instructor.name,
            bio: instructor.bio,
            avatarUrl: instructor.avatarUrl,
          },
        },
      },
      include: {
        modules: true,
        categories: true,
        video: true,
        certificate: true,
        instructor: true,
      },
    });

    return NextResponse.json(learningPath, { status: 201 });
  } catch (error) {
    console.error('Failed to create Learning Path:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
