const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/api/docs/openapi.json');
const openapi = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Add Tag
if (!openapi.tags.find(t => t.name === 'Learning Paths')) {
  openapi.tags.push({ name: 'Learning Paths', description: 'Composite resource for learning paths' });
}

// 2. Add Schemas
openapi.components.schemas['LearningPathModule'] = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    position: { type: 'integer' },
    learningPathId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

openapi.components.schemas['Certificate'] = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    templateUrl: { type: 'string', nullable: true },
    learningPathId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

openapi.components.schemas['Instructor'] = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    bio: { type: 'string', nullable: true },
    avatarUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

openapi.components.schemas['LearningPath'] = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    isPublished: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    modules: { type: 'array', items: { $ref: '#/components/schemas/LearningPathModule' } },
    categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
    video: { $ref: '#/components/schemas/YouTubeVideo' },
    certificate: { $ref: '#/components/schemas/Certificate' },
    instructor: { $ref: '#/components/schemas/Instructor' }
  }
};

// 3. Add Paths
openapi.paths['/api/learning-paths'] = {
  post: {
    tags: ['Learning Paths'],
    operationId: 'createLearningPath',
    summary: 'Create a learning path with nested resources',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['title', 'instructor'],
            properties: {
              title: { type: 'string', minLength: 3, example: 'Full-Stack Bootcamp' },
              description: { type: 'string', example: 'Complete course' },
              modules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'HTML Basics' },
                    description: { type: 'string' },
                    position: { type: 'integer', example: 1 }
                  }
                }
              },
              categoryIds: {
                type: 'array',
                items: { type: 'string' }
              },
              video: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  videoId: { type: 'string' }
                }
              },
              certificate: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  templateUrl: { type: 'string' }
                }
              },
              instructor: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  bio: { type: 'string' },
                  avatarUrl: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      '201': {
        description: 'LearningPath created with all nested relations',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LearningPath' }
          }
        }
      },
      '400': { description: 'Validation error' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden — admin only' },
      '500': { description: 'Internal Server Error' }
    }
  }
};

fs.writeFileSync(filePath, JSON.stringify(openapi, null, 2) + '\n');
console.log('Successfully updated openapi.json');
