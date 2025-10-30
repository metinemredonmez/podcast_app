import { resetDb, seedDb } from './setup-prisma';

beforeAll(async () => {
  await resetDb();
  await seedDb();
});

afterAll(async () => {
  await resetDb();
});

