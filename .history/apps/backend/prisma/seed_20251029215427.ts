import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create an admin user (idempotent)
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: '$2b$10$7zVnTqQdKQv2F9i1s6zWQO0pQd6rQyZfQw3xJkz8Q3o7VnE9aJw3S', // bcrypt hash placeholder
      name: 'Admin',
    },
  });

  // Create a sample podcast for the admin
  const podcast = await prisma.podcast.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Sample Podcast',
      description: 'Welcome to the sample podcast!',
      userId: user.id,
    },
  });

  // Create a couple of episodes
  const now = new Date();
  await prisma.episode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      title: 'Episode 1: Getting Started',
      duration: 1800,
      audioUrl: 'https://cdn.example.com/audio/ep1.mp3',
      publishedAt: now,
      podcastId: podcast.id,
    },
  });
  await prisma.episode.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      title: 'Episode 2: Deep Dive',
      duration: 2700,
      audioUrl: 'https://cdn.example.com/audio/ep2.mp3',
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      podcastId: podcast.id,
    },
  });

  console.log('✅ Seed completed: user, podcast, episodes created/ensured.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
