import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Episodes E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTenant: { id: string };
  let creatorUser: { id: string; email: string };
  let listenerUser: { id: string; email: string };
  let creatorToken: string;
  let listenerToken: string;
  let testPodcast: { id: string };

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
        name: 'Episodes E2E Tenant',
        slug: `episodes-e2e-${Date.now()}`,
        isActive: true,
      },
    });

    // Create users
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    creatorUser = await prisma.user.create({
      data: {
        email: `ep-creator-${Date.now()}@e2e.test`,
        name: 'Episode Creator',
        passwordHash,
        tenantId: testTenant.id,
        role: 'CREATOR',
        emailVerified: true,
        isActive: true,
      },
    });

    listenerUser = await prisma.user.create({
      data: {
        email: `ep-listener-${Date.now()}@e2e.test`,
        name: 'Episode Listener',
        passwordHash,
        tenantId: testTenant.id,
        role: 'LISTENER',
        emailVerified: true,
        isActive: true,
      },
    });

    // Create test podcast
    testPodcast = await prisma.podcast.create({
      data: {
        title: 'Episode Test Podcast',
        slug: `episode-test-${Date.now()}`,
        description: 'Podcast for episode testing',
        tenantId: testTenant.id,
        ownerId: creatorUser.id,
        isPublished: true,
        publishedAt: new Date(),
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
    await prisma.episode.deleteMany({ where: { podcastId: testPodcast.id } }).catch(() => {});
    await prisma.podcast.deleteMany({ where: { tenantId: testTenant.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: testTenant.id } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: testTenant.id } }).catch(() => {});
    await app.close();
  });

  describe('POST /api/episodes', () => {
    it('should create episode as podcast owner', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/episodes')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          podcastId: testPodcast.id,
          title: 'First Episode',
          description: 'The first episode of the podcast',
          audioUrl: 'https://example.com/audio/episode1.mp3',
          duration: 1800,
          episodeNumber: 1,
          seasonNumber: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'First Episode');
      expect(response.body).toHaveProperty('duration', 1800);
      expect(response.body).toHaveProperty('isPublished', false);
    });

    it('should fail when listener tries to create episode', async () => {
      await request(app.getHttpServer())
        .post('/api/episodes')
        .set('Authorization', `Bearer ${listenerToken}`)
        .send({
          podcastId: testPodcast.id,
          title: 'Unauthorized Episode',
          audioUrl: 'https://example.com/audio/fail.mp3',
          duration: 1200,
        })
        .expect(403);
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/episodes')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          podcastId: testPodcast.id,
        })
        .expect(400);
    });
  });

  describe('GET /api/episodes', () => {
    beforeAll(async () => {
      await prisma.episode.createMany({
        data: [
          {
            title: 'List Episode 1',
            slug: `list-ep-1-${Date.now()}`,
            description: 'First list episode',
            tenantId: testTenant.id,
            podcastId: testPodcast.id,
            hostId: creatorUser.id,
            audioUrl: 'https://example.com/audio/list1.mp3',
            duration: 1500,
            isPublished: true,
            publishedAt: new Date(),
            episodeNumber: 2,
            seasonNumber: 1,
          },
          {
            title: 'List Episode 2',
            slug: `list-ep-2-${Date.now()}`,
            description: 'Second list episode',
            tenantId: testTenant.id,
            podcastId: testPodcast.id,
            hostId: creatorUser.id,
            audioUrl: 'https://example.com/audio/list2.mp3',
            duration: 2100,
            isPublished: true,
            publishedAt: new Date(),
            episodeNumber: 3,
            seasonNumber: 1,
          },
        ],
      });
    });

    it('should list episodes for a podcast', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/episodes?podcastId=${testPodcast.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/episodes?podcastId=${testPodcast.id}&limit=1`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
    });
  });

  describe('GET /api/episodes/:id', () => {
    let testEpisode: { id: string; title: string };

    beforeAll(async () => {
      testEpisode = await prisma.episode.create({
        data: {
          title: 'Detail Episode',
          slug: `detail-ep-${Date.now()}`,
          description: 'Episode for detail testing',
          tenantId: testTenant.id,
          podcastId: testPodcast.id,
          hostId: creatorUser.id,
          audioUrl: 'https://example.com/audio/detail.mp3',
          duration: 1800,
          isPublished: true,
          publishedAt: new Date(),
          episodeNumber: 10,
          seasonNumber: 1,
        },
      });
    });

    it('should get episode by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/episodes/${testEpisode.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testEpisode.id);
      expect(response.body).toHaveProperty('title', testEpisode.title);
    });

    it('should return 404 for non-existent episode', async () => {
      await request(app.getHttpServer())
        .get('/api/episodes/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/episodes/:id', () => {
    let testEpisode: { id: string };

    beforeAll(async () => {
      testEpisode = await prisma.episode.create({
        data: {
          title: 'Update Episode',
          slug: `update-ep-${Date.now()}`,
          description: 'Original description',
          tenantId: testTenant.id,
          podcastId: testPodcast.id,
          hostId: creatorUser.id,
          audioUrl: 'https://example.com/audio/update.mp3',
          duration: 1500,
          episodeNumber: 20,
          seasonNumber: 1,
        },
      });
    });

    it('should update episode as podcast owner', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/episodes/${testEpisode.id}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          description: 'Updated description',
          duration: 2000,
        })
        .expect(200);

      expect(response.body).toHaveProperty('description', 'Updated description');
      expect(response.body).toHaveProperty('duration', 2000);
    });

    it('should fail when non-owner tries to update', async () => {
      await request(app.getHttpServer())
        .patch(`/api/episodes/${testEpisode.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .send({
          description: 'Unauthorized update',
        })
        .expect(403);
    });
  });

  describe('POST /api/episodes/:id/publish', () => {
    let draftEpisode: { id: string };

    beforeAll(async () => {
      draftEpisode = await prisma.episode.create({
        data: {
          title: 'Draft Episode',
          slug: `draft-ep-${Date.now()}`,
          description: 'Draft episode to publish',
          tenantId: testTenant.id,
          podcastId: testPodcast.id,
          hostId: creatorUser.id,
          audioUrl: 'https://example.com/audio/draft.mp3',
          duration: 1200,
          isPublished: false,
          episodeNumber: 30,
          seasonNumber: 1,
        },
      });
    });

    it('should publish episode as podcast owner', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/episodes/${draftEpisode.id}/publish`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('isPublished', true);
      expect(response.body).toHaveProperty('publishedAt');
    });
  });

  describe('DELETE /api/episodes/:id', () => {
    let deleteEpisode: { id: string };

    beforeEach(async () => {
      deleteEpisode = await prisma.episode.create({
        data: {
          title: 'Delete Episode',
          slug: `delete-ep-${Date.now()}`,
          description: 'Episode to delete',
          tenantId: testTenant.id,
          podcastId: testPodcast.id,
          hostId: creatorUser.id,
          audioUrl: 'https://example.com/audio/delete.mp3',
          duration: 900,
          episodeNumber: 40,
          seasonNumber: 1,
        },
      });
    });

    it('should delete episode as podcast owner', async () => {
      await request(app.getHttpServer())
        .delete(`/api/episodes/${deleteEpisode.id}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      const deleted = await prisma.episode.findUnique({ where: { id: deleteEpisode.id } });
      expect(deleted).toBeNull();
    });

    it('should fail when non-owner tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/api/episodes/${deleteEpisode.id}`)
        .set('Authorization', `Bearer ${listenerToken}`)
        .expect(403);
    });
  });
});
