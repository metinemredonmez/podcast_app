import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Podcasts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTenant: { id: string; slug: string };
  let creatorUser: { id: string; email: string };
  let listenerUser: { id: string; email: string };
  let creatorToken: string;
  let listenerToken: string;
  let testCategory: { id: string; slug: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get(PrismaService);
    await app.init();

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Podcast E2E Tenant',
        slug: `podcast-e2e-${Date.now()}`,
        isActive: true,
      },
    });

    // Create category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `test-cat-${Date.now()}`,
        tenantId: testTenant.id,
      },
    });

    // Create creator user
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    creatorUser = await prisma.user.create({
      data: {
        email: `creator-${Date.now()}@e2e.test`,
        name: 'Creator User',
        passwordHash,
        tenantId: testTenant.id,
        role: 'CREATOR',
        emailVerified: true,
        isActive: true,
      },
    });

    // Create listener user
    listenerUser = await prisma.user.create({
      data: {
        email: `listener-${Date.now()}@e2e.test`,
        name: 'Listener User',
        passwordHash,
        tenantId: testTenant.id,
        role: 'LISTENER',
        emailVerified: true,
        isActive: true,
      },
    });

    // Get tokens
    const creatorLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: creatorUser.email, password: 'TestPassword123!' });
    creatorToken = creatorLogin.body.accessToken;

    const listenerLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: listenerUser.email, password: 'TestPassword123!' });
    listenerToken = listenerLogin.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.podcast.deleteMany({ where: { tenantId: testTenant.id } }).catch(() => {});
    await prisma.category.deleteMany({ where: { tenantId: testTenant.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: testTenant.id } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: testTenant.id } }).catch(() => {});
    await app.close();
  });

  describe('POST /api/podcasts', () => {
    it('should create podcast as creator', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/podcasts')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'My Test Podcast',
          description: 'A test podcast description',
          ownerId: creatorUser.id,
          categoryIds: [testCategory.id],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'My Test Podcast');
      expect(response.body).toHaveProperty('slug', 'my-test-podcast');
      expect(response.body).toHaveProperty('isPublished', false);
    });

    it('should fail when listener tries to create podcast', async () => {
      await request(app.getHttpServer())
        .post('/api/podcasts')
        .set('Authorization', `Bearer ${listenerToken}`)
        .send({
          title: 'Listener Podcast',
          description: 'Should fail',
          ownerId: listenerUser.id,
        })
        .expect(403);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/podcasts')
        .send({
          title: 'No Auth Podcast',
          description: 'Should fail',
          ownerId: creatorUser.id,
        })
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/podcasts')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          description: 'Missing title',
        })
        .expect(400);
    });
  });

  describe('GET /api/podcasts', () => {
    let testPodcast: { id: string };

    beforeAll(async () => {
      // Create a published podcast
      testPodcast = await prisma.podcast.create({
        data: {
          title: 'Published Podcast',
          slug: `published-podcast-${Date.now()}`,
          description: 'A published test podcast',
          tenantId: testTenant.id,
          ownerId: creatorUser.id,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    });

    it('should list podcasts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/podcasts')
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/podcasts?limit=5')
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/podcasts/:id', () => {
    let testPodcast: { id: string; title: string };

    beforeAll(async () => {
      testPodcast = await prisma.podcast.create({
        data: {
          title: 'Detail Podcast',
          slug: `detail-podcast-${Date.now()}`,
          description: 'Podcast for detail testing',
          tenantId: testTenant.id,
          ownerId: creatorUser.id,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    });

    it('should get podcast by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/podcasts/${testPodcast.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testPodcast.id);
      expect(response.body).toHaveProperty('title', testPodcast.title);
    });

    it('should return 404 for non-existent podcast', async () => {
      await request(app.getHttpServer())
        .get('/api/podcasts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/podcasts/:id', () => {
    let testPodcast: { id: string };

    beforeAll(async () => {
      testPodcast = await prisma.podcast.create({
        data: {
          title: 'Update Test Podcast',
          slug: `update-test-${Date.now()}`,
          description: 'Original description',
          tenantId: testTenant.id,
          ownerId: creatorUser.id,
        },
      });
    });

    it('should update podcast as owner', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/podcasts/${testPodcast.id}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toHaveProperty('description', 'Updated description');
    });

    it('should fail when non-owner tries to update', async () => {
      await request(app.getHttpServer())
        .patch(`/api/podcasts/${testPodcast.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .send({
          description: 'Unauthorized update',
        })
        .expect(403);
    });
  });

  describe('POST /api/podcasts/:id/publish', () => {
    let testPodcast: { id: string };

    beforeAll(async () => {
      testPodcast = await prisma.podcast.create({
        data: {
          title: 'Publish Test Podcast',
          slug: `publish-test-${Date.now()}`,
          description: 'Draft podcast',
          tenantId: testTenant.id,
          ownerId: creatorUser.id,
          isPublished: false,
        },
      });
    });

    it('should publish podcast as owner', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/podcasts/${testPodcast.id}/publish`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('isPublished', true);
      expect(response.body).toHaveProperty('publishedAt');
    });
  });

  describe('DELETE /api/podcasts/:id', () => {
    let testPodcast: { id: string };

    beforeEach(async () => {
      testPodcast = await prisma.podcast.create({
        data: {
          title: 'Delete Test Podcast',
          slug: `delete-test-${Date.now()}`,
          description: 'Podcast to delete',
          tenantId: testTenant.id,
          ownerId: creatorUser.id,
        },
      });
    });

    it('should delete podcast as owner', async () => {
      await request(app.getHttpServer())
        .delete(`/api/podcasts/${testPodcast.id}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.podcast.findUnique({ where: { id: testPodcast.id } });
      expect(deleted).toBeNull();
    });

    it('should fail when non-owner tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/api/podcasts/${testPodcast.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(403);
    });
  });
});
