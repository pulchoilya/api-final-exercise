import { prisma } from '../src/lib/prisma';

async function main() {
  // First ensure there's at least one category to link to
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Test Category', slug: 'test-category' }
    });
  }

  const learningPath = await prisma.learningPath.create({
    data: {
      title: 'Full-Stack Web Dev Bootcamp',
      slug: 'full-stack-bootcamp-' + Date.now(),
      description: 'Learn everything from zero to hero',
      isPublished: true,
      modules: {
        create: [
          { title: 'HTML & CSS', description: 'Basics', position: 1 },
          { title: 'JavaScript', description: 'Logic', position: 2 }
        ]
      },
      categories: {
        connect: [{ id: category.id }]
      },
      video: {
        create: {
          title: 'Intro to Bootcamp',
          videoId: 'dQw4w9WgXcQ',
          isPublished: true
        }
      },
      certificate: {
        create: {
          name: 'Full-Stack Graduate',
          templateUrl: 'https://example.com/cert.pdf'
        }
      },
      instructor: {
        create: {
          name: 'Jane Doe',
          bio: 'Senior Developer',
          avatarUrl: 'https://example.com/jane.jpg'
        }
      }
    },
    include: {
      modules: true,
      categories: true,
      video: true,
      certificate: true,
      instructor: true
    }
  });

  console.log('Successfully created composite entity LearningPath!');
  console.log(JSON.stringify(learningPath, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
