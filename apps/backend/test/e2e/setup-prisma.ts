import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDb(): Promise<void> {
  await prisma.$transaction([
    prisma.episode.deleteMany({}),
    prisma.podcast.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);
}

export async function seedDb(): Promise<void> {
  // Reuse the application seed logic by importing or call programmatically
  await import('../../prisma/seed');
}

