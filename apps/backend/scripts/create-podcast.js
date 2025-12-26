const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stream = await prisma.liveStream.findUnique({
    where: { id: 'cmjls6ksz0002mru0uy7w79u4' },
    include: { host: true }
  });

  if (!stream) {
    console.log('Stream bulunamadi');
    return;
  }

  console.log('Stream:', stream.title, stream.recordingUrl);

  const podcast = await prisma.podcast.create({
    data: {
      tenantId: stream.tenantId,
      ownerId: stream.hostId,
      title: stream.title,
      slug: 'canli-' + stream.id.slice(-8),
      description: stream.description || 'Canli yayin kaydi',
      mediaType: 'AUDIO',
      audioUrl: stream.recordingUrl,
      duration: stream.duration || 0,
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date(),
      categories: {
        create: [{
          categoryId: '38c83764-7363-4de2-8929-32525a037bbe'
        }]
      }
    }
  });

  console.log('Podcast olusturuldu:', podcast.id, podcast.title);

  const episode = await prisma.episode.create({
    data: {
      tenantId: stream.tenantId,
      podcastId: podcast.id,
      title: stream.title,
      slug: 'bolum-1',
      description: stream.description || 'Canli yayin kaydi',
      duration: stream.duration || 0,
      audioUrl: stream.recordingUrl,
      isPublished: true,
      publishedAt: new Date(),
      episodeNumber: 1
    }
  });

  console.log('Episode olusturuldu:', episode.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
