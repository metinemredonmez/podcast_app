import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTenant: { id: string; slug: string };
  let testUser: { id: string; email: string };

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
        name: 'E2E Test Tenant',
        slug: `e2e-test-${Date.now()}`,
        isActive: true,
      },
    });

    // Create test user
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@e2e.test`,
        name: 'E2E Test User',
        passwordHash,
        tenantId: testTenant.id,
        role: 'LISTENER',
        emailVerified: true,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: testTenant.id } }).catch(() => {});
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@e2e.test',
          password: 'TestPassword123!',
        })
        .expect(401);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    const newUserEmail = `new-user-${Date.now()}@e2e.test`;

    afterAll(async () => {
      // Cleanup new user if created
      await prisma.user.deleteMany({ where: { email: newUserEmail } }).catch(() => {});
    });

    it('should register new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: newUserEmail,
          password: 'NewUserPassword123!',
          name: 'New Test User',
          tenantId: testTenant.id,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('email', newUserEmail);
    });

    it('should fail when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: 'AnotherPassword123!',
          name: 'Duplicate User',
          tenantId: testTenant.id,
        })
        .expect(409);
    });

    it('should fail with weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'weak-pass@e2e.test',
          password: '123',
          name: 'Weak Pass User',
          tenantId: testTenant.id,
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get refresh token
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });

      refreshToken = response.body.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });

      accessToken = response.body.accessToken;
    });

    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
