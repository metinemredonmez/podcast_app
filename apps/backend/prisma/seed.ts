import bcrypt from 'bcrypt';
import {
  PrismaClient,
  UserRole,
  AnalyticsEventType,
  NotificationType,
  DownloadStatus,
  CollaboratorRole,
  CollaboratorStatus,
  ScheduleStatus,
  ModerationStatus,
  StreamStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function resolveAdminPasswordHash(): Promise<string> {
  const passwordHashFromEnv = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHashFromEnv) {
    return passwordHashFromEnv;
  }
  const plainPassword = process.env.ADMIN_PASSWORD;
  if (!plainPassword) {
    throw new Error('ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be provided for seeding.');
  }
  const saltRounds = Number(process.env.ADMIN_PASSWORD_SALT_ROUNDS ?? 12);
  return bcrypt.hash(plainPassword, saltRounds);
}

async function main(): Promise<void> {
  console.log('🌱 Starting comprehensive database seeding...\n');

  // ==================== TENANTS ====================
  console.log('📦 Creating tenants...');
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: process.env.ADMIN_TENANT_SLUG ?? 'default' },
    update: { name: process.env.ADMIN_TENANT_NAME ?? 'Default Tenant' },
    create: {
      name: process.env.ADMIN_TENANT_NAME ?? 'Default Tenant',
      slug: process.env.ADMIN_TENANT_SLUG ?? 'default',
      description: 'Ana platform tenant',
      isActive: true,
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: { name: 'Demo Tenant' },
    create: {
      name: 'Demo Tenant',
      slug: 'demo',
      description: 'Demo ve test amaçlı tenant',
      isActive: true,
    },
  });

  console.log(`✅ Created/Updated 2 tenants: ${tenant1.slug}, ${tenant2.slug}\n`);

  // ==================== USERS ====================
  console.log('👥 Creating users...');
  const passwordHash = await resolveAdminPasswordHash();
  const simplePasswordHash = await bcrypt.hash('password123', 10);

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@podcast.dev';
  const adminName = process.env.ADMIN_NAME ?? 'Platform Admin';

  // Check if admin user already exists
  let adminUser = await prisma.user.findFirst({
    where: { tenantId: tenant1.id, email: adminEmail },
  });

  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        name: adminName,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });
  } else {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        tenantId: tenant1.id,
        passwordHash,
        role: UserRole.ADMIN,
        emailVerified: true,
        bio: 'Platform yöneticisi',
      },
    });
  }

  // Create multiple users with different roles
  const usersData = [
    {
      email: 'admin1@podcast.dev',
      name: 'Ahmet Yılmaz',
      role: UserRole.ADMIN,
      bio: 'İçerik editörü ve podcast moderatörü',
    },
    {
      email: 'admin2@podcast.dev',
      name: 'Ayşe Demir',
      role: UserRole.ADMIN,
      bio: 'Kıdemli içerik editörü',
    },
    {
      email: 'hoca1@podcast.dev',
      name: 'Mehmet Kaya',
      role: UserRole.HOCA,
      bio: 'Tarih ve kültür podcast içerik üreticisi',
    },
    {
      email: 'hoca2@podcast.dev',
      name: 'Fatma Şahin',
      role: UserRole.HOCA,
      bio: 'Din ve ahlak konularında içerik üreticisi',
    },
    {
      email: 'hoca3@podcast.dev',
      name: 'Ali Özkan',
      role: UserRole.HOCA,
      bio: 'Gençlik ve eğitim podcast yapımcısı',
    },
    {
      email: 'user1@podcast.dev',
      name: 'Zeynep Arslan',
      role: UserRole.USER,
      bio: 'Podcast meraklısı dinleyici',
    },
    {
      email: 'user2@podcast.dev',
      name: 'Mustafa Çelik',
      role: UserRole.USER,
      bio: 'Aktif podcast takipçisi',
    },
    {
      email: 'user3@podcast.dev',
      name: 'Elif Yıldız',
      role: UserRole.USER,
      bio: 'Düzenli dinleyici',
    },
    {
      email: 'user4@podcast.dev',
      name: 'Burak Aydın',
      role: UserRole.USER,
      bio: 'Yeni podcast keşfedici',
    },
    {
      email: 'user5@podcast.dev',
      name: 'Selin Karaca',
      role: UserRole.USER,
      bio: 'Podcast tutkunu',
    },
  ];

  const users = [];
  for (const userData of usersData) {
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant1.id, email: userData.email },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: userData.name, role: userData.role },
      });
    } else {
      user = await prisma.user.create({
        data: {
          ...userData,
          tenantId: tenant1.id,
          passwordHash: simplePasswordHash,
          emailVerified: true,
          isActive: true,
        },
      });
    }
    users.push(user);
  }

  console.log(`✅ Created/Updated ${users.length + 1} users\n`);

  // ==================== CATEGORIES ====================
  console.log('📚 Creating categories...');
  const categoriesData = [
    { name: 'Din', slug: 'din', description: 'İslami konular ve dini içerikler', iconUrl: '🕌' },
    { name: 'Tarih', slug: 'tarih', description: 'İslam tarihi ve dünya tarihi', iconUrl: '📜' },
    { name: 'Fıkıh', slug: 'fikih', description: 'İslam hukuku ve fıkıh meseleleri', iconUrl: '⚖️' },
    { name: 'Siyer', slug: 'siyer', description: 'Hz. Muhammed\'in hayatı ve siyer', iconUrl: '🌙' },
    { name: 'Tefsir', slug: 'tefsir', description: 'Kuran tefsiri ve meal açıklamaları', iconUrl: '📖' },
    { name: 'Hadis', slug: 'hadis', description: 'Hadis şerhleri ve hadis ilimleri', iconUrl: '📿' },
    { name: 'Akaid', slug: 'akaid', description: 'İslam inanç esasları', iconUrl: '💫' },
    { name: 'Tasavvuf', slug: 'tasavvuf', description: 'Tasavvuf ve ruhani gelişim', iconUrl: '🧘' },
    { name: 'Aile', slug: 'aile', description: 'Aile, evlilik ve çocuk eğitimi', iconUrl: '👨‍👩‍👧‍👦' },
    { name: 'Gençlik', slug: 'genclik', description: 'Gençlere yönelik konular', iconUrl: '🎓' },
  ];

  const categories = [];
  for (let i = 0; i < categoriesData.length; i++) {
    const category = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant1.id, slug: categoriesData[i].slug } },
      update: { name: categoriesData[i].name },
      create: {
        ...categoriesData[i],
        tenantId: tenant1.id,
        sortOrder: i,
      },
    });
    categories.push(category);
  }

  console.log(`✅ Created/Updated ${categories.length} categories\n`);

  // ==================== HOCAS ====================
  console.log('👨‍🏫 Creating hocas...');
  const hocasData = [
    {
      name: 'Dr. Ahmet Davutoğlu',
      bio: 'Siyaset bilimci, akademisyen ve eski başbakan. İslam dünyası ve uluslararası ilişkiler uzmanı.',
      expertise: 'Uluslararası İlişkiler, İslam Dünyası',
    },
    {
      name: 'Prof. Dr. Hayrettin Karaman',
      bio: 'İslam hukuku uzmanı, fıkıh alimi. 50 yılı aşkın akademik ve fikri çalışmaları bulunmaktadır.',
      expertise: 'Fıkıh, İslam Hukuku',
    },
    {
      name: 'Ömer Döngeloğlu',
      bio: 'İlahiyatçı ve yazar. İslami konularda yazdığı kitaplar ve verdiği derslerle tanınır.',
      expertise: 'Tefsir, Hadis',
    },
    {
      name: 'Nureddin Yıldız',
      bio: 'İlahiyatçı, yazar ve hatip. Geniş kitlelere ulaşan sohbet ve dersleriyle bilinir.',
      expertise: 'Siyer, Ahlak, Tasavvuf',
    },
    {
      name: 'İhsan Şenocak',
      bio: 'İlahiyatçı, televizyon programcısı ve yazar. Modern hayatla İslami değerleri buluşturmaktadır.',
      expertise: 'Güncel Meseleler, Aile',
    },
  ];

  const hocas = [];
  for (const hocaData of hocasData) {
    // Use findFirst + create/update pattern to avoid duplicate errors
    let hoca = await prisma.hoca.findFirst({
      where: { tenantId: tenant1.id, name: hocaData.name },
    });

    if (hoca) {
      hoca = await prisma.hoca.update({
        where: { id: hoca.id },
        data: { bio: hocaData.bio, expertise: hocaData.expertise, isActive: true },
      });
    } else {
      hoca = await prisma.hoca.create({
        data: {
          ...hocaData,
          tenantId: tenant1.id,
          isActive: true,
        },
      });
    }
    hocas.push(hoca);
  }

  console.log(`✅ Created/Updated ${hocas.length} hocas\n`);

  // ==================== PODCASTS ====================
  console.log('🎙️ Creating podcasts...');
  const podcastsData = [
    {
      title: 'İslam Tarihi Sohbetleri',
      slug: 'islam-tarihi-sohbetleri',
      description:
        'İslam tarihinin önemli olayları, şahsiyetleri ve dönemlerini ele alan kapsamlı bir sohbet serisi.',
      categoryIndexes: [1], // Tarih
      hocaIndex: 0,
      ownerIndex: 2, // creator1
      isPublished: true,
    },
    {
      title: 'Fıkıh Meseleleri',
      slug: 'fikih-meseleleri',
      description: 'Günlük hayatta karşılaşılan fıkıh konularını soru-cevap formatında ele alıyoruz.',
      categoryIndexes: [2], // Fıkıh
      hocaIndex: 1,
      ownerIndex: 2,
      isPublished: true,
    },
    {
      title: 'Siyer Dersleri',
      slug: 'siyer-dersleri',
      description: 'Hz. Muhammed\'in hayatını detaylıca inceliyoruz.',
      categoryIndexes: [3], // Siyer
      hocaIndex: 3,
      ownerIndex: 3, // creator2
      isPublished: true,
    },
    {
      title: 'Kuran Tefsiri',
      slug: 'kuran-tefsiri',
      description: 'Kuran-ı Kerim\'in meal ve tefsirini sure sure ele alıyoruz.',
      categoryIndexes: [4], // Tefsir
      hocaIndex: 2,
      ownerIndex: 3,
      isPublished: true,
    },
    {
      title: 'Hadis Şerhleri',
      slug: 'hadis-serhleri',
      description: 'Sahih hadisleri inceliyor ve günümüze uyarlamalarını yapıyoruz.',
      categoryIndexes: [5], // Hadis
      hocaIndex: 2,
      ownerIndex: 2,
      isPublished: true,
    },
    {
      title: 'İman Esasları',
      slug: 'iman-esaslari',
      description: 'İslam\'ın temel inanç esaslarını öğreniyoruz.',
      categoryIndexes: [6], // Akaid
      hocaIndex: 1,
      ownerIndex: 3,
      isPublished: true,
    },
    {
      title: 'Tasavvuf Sohbetleri',
      slug: 'tasavvuf-sohbetleri',
      description: 'Kalp dünyası, ruhani gelişim ve tasavvufi konular.',
      categoryIndexes: [7], // Tasavvuf
      hocaIndex: 3,
      ownerIndex: 4, // creator3
      isPublished: true,
    },
    {
      title: 'Ailede Huzur',
      slug: 'ailede-huzur',
      description: 'Aile hayatı, evlilik ve çocuk eğitimi üzerine pratik öneriler.',
      categoryIndexes: [8], // Aile
      hocaIndex: 4,
      ownerIndex: 4,
      isPublished: true,
    },
    {
      title: 'Gençlere Özel',
      slug: 'genclere-ozel',
      description: 'Gençlerin günlük hayatta karşılaştığı sorunlara İslami çözümler.',
      categoryIndexes: [9], // Gençlik
      hocaIndex: 4,
      ownerIndex: 4,
      isPublished: true,
    },
    {
      title: 'Ramazan Sohbetleri',
      slug: 'ramazan-sohbetleri',
      description: 'Ramazan ayına özel manevi sohbetler.',
      categoryIndexes: [0, 7], // Din, Tasavvuf
      hocaIndex: 3,
      ownerIndex: 3,
      isPublished: true,
    },
    {
      title: 'Güncel Meseleler',
      slug: 'guncel-meseleler',
      description: 'Gündemdeki konuları İslami perspektiften değerlendiriyoruz.',
      categoryIndexes: [0], // Din
      hocaIndex: 4,
      ownerIndex: 2,
      isPublished: true,
    },
    {
      title: 'Kırk Hadis Şerhi',
      slug: 'kirk-hadis-serhi',
      description: 'İmam Nevevi\'nin Kırk Hadis eserini şerh ediyoruz.',
      categoryIndexes: [5], // Hadis
      hocaIndex: 2,
      ownerIndex: 3,
      isPublished: true,
    },
    {
      title: 'İslam ve Bilim',
      slug: 'islam-ve-bilim',
      description: 'İslam medeniyetinin bilime katkıları ve İslam-bilim ilişkisi.',
      categoryIndexes: [0, 1], // Din, Tarih
      hocaIndex: 0,
      ownerIndex: 2,
      isPublished: false,
    },
    {
      title: 'Cuma Sohbetleri',
      slug: 'cuma-sohbetleri',
      description: 'Her cuma günü özel konuları ele alan sohbet serisi.',
      categoryIndexes: [0], // Din
      hocaIndex: 3,
      ownerIndex: 4,
      isPublished: true,
    },
    {
      title: 'Kıssa ve İbretler',
      slug: 'kissa-ve-ibretler',
      description: 'İslam tarihinden kıssalar ve ibret alınacak hikayeler.',
      categoryIndexes: [1, 3], // Tarih, Siyer
      hocaIndex: 3,
      ownerIndex: 2,
      isPublished: false,
    },
  ];

  const podcasts = [];
  for (const podcastData of podcastsData) {
    // Check if podcast already exists
    let podcast = await prisma.podcast.findFirst({
      where: { tenantId: tenant1.id, slug: podcastData.slug },
    });

    if (podcast) {
      podcast = await prisma.podcast.update({
        where: { id: podcast.id },
        data: {
          title: podcastData.title,
          description: podcastData.description,
          hocaId: hocas[podcastData.hocaIndex].id,
          isPublished: podcastData.isPublished,
          publishedAt: podcastData.isPublished ? new Date() : null,
        },
      });
    } else {
      podcast = await prisma.podcast.create({
        data: {
          title: podcastData.title,
          slug: podcastData.slug,
          description: podcastData.description,
          tenantId: tenant1.id,
          ownerId: users[podcastData.ownerIndex].id,
          hocaId: hocas[podcastData.hocaIndex].id,
          isPublished: podcastData.isPublished,
          publishedAt: podcastData.isPublished ? new Date() : null,
          language: 'tr',
          categories: {
            create: podcastData.categoryIndexes.map((idx) => ({
              categoryId: categories[idx].id,
            })),
          },
        },
      });
    }
    podcasts.push(podcast);
  }

  console.log(`✅ Created ${podcasts.length} podcasts\n`);

  // ==================== EPISODES ====================
  console.log('🎧 Creating episodes...');
  let totalEpisodes = 0;

  for (let podcastIndex = 0; podcastIndex < podcasts.length; podcastIndex++) {
    const podcast = podcasts[podcastIndex];
    const episodeCount = podcast.isPublished ? 5 : 2; // Published podcasts have 5 episodes, drafts have 2

    for (let i = 1; i <= episodeCount; i++) {
      await prisma.episode.create({
        data: {
          title: `${podcast.title} - Bölüm ${i}`,
          slug: `bolum-${i}`,
          description: `${podcast.title} serisinin ${i}. bölümü. Bu bölümde önemli konuları ele alıyoruz.`,
          tenantId: tenant1.id,
          podcastId: podcast.id,
          hostId: podcast.ownerId,
          duration: 1800 + Math.floor(Math.random() * 1800), // 30-60 dakika arası
          audioUrl: `https://storage.podcast.app/audio/${podcast.slug}/episode-${i}.mp3`,
          isPublished: podcast.isPublished,
          publishedAt: podcast.isPublished ? new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000) : null, // Her hafta bir bölüm
          episodeNumber: i,
          seasonNumber: 1,
        },
      });
      totalEpisodes++;
    }
  }

  console.log(`✅ Created ${totalEpisodes} episodes\n`);

  // ==================== FOLLOWS ====================
  console.log('❤️ Creating follows...');
  const listeners = users.filter((u) => u.role === UserRole.USER);
  let followCount = 0;

  for (const listener of listeners) {
    // Her dinleyici rastgele 3-7 podcast takip ediyor
    const followingCount = 3 + Math.floor(Math.random() * 5);
    const shuffledPodcasts = [...podcasts].sort(() => Math.random() - 0.5);

    for (let i = 0; i < followingCount && i < shuffledPodcasts.length; i++) {
      const podcast = shuffledPodcasts[i];
      if (podcast.isPublished) {
        await prisma.follow.create({
          data: {
            tenantId: tenant1.id,
            userId: listener.id,
            podcastId: podcast.id,
          },
        });
        followCount++;
      }
    }
  }

  console.log(`✅ Created ${followCount} follows\n`);

  // ==================== COMMENTS ====================
  console.log('💬 Creating comments...');
  const allEpisodes = await prisma.episode.findMany({
    where: { isPublished: true },
  });

  let commentCount = 0;
  for (const episode of allEpisodes.slice(0, 20)) {
    // İlk 20 episode'a yorum
    const commentersCount = 1 + Math.floor(Math.random() * 3); // 1-3 yorum per episode

    for (let i = 0; i < commentersCount && i < listeners.length; i++) {
      await prisma.comment.create({
        data: {
          tenantId: tenant1.id,
          episodeId: episode.id,
          userId: listeners[i].id,
          content: [
            'Çok faydalı bir bölüm olmuş, teşekkürler.',
            'Mükemmel anlatım, Allah razı olsun.',
            'Bu konuyu çok merak ediyordum, açıklayıcı olmuş.',
            'Harika bir seri, devamını bekliyoruz.',
            'Çok güzel izah ettiniz, elinize sağlık.',
          ][Math.floor(Math.random() * 5)],
        },
      });
      commentCount++;
    }
  }

  console.log(`✅ Created ${commentCount} comments\n`);

  // ==================== ANALYTICS EVENTS ====================
  console.log('📊 Creating analytics events...');
  const publishedEpisodes = await prisma.episode.findMany({
    where: { isPublished: true },
    include: { podcast: true },
  });

  // Son 30 gün için analytics oluştur
  const daysToGenerate = 30;
  let eventCount = 0;

  for (let day = 0; day < daysToGenerate; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    // Her gün 50-150 event oluştur
    const eventsPerDay = 50 + Math.floor(Math.random() * 100);

    for (let e = 0; e < eventsPerDay; e++) {
      const randomEpisode = publishedEpisodes[Math.floor(Math.random() * publishedEpisodes.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Event tipini rastgele seç
      const eventTypes = [
        AnalyticsEventType.PODCAST_PLAY,
        AnalyticsEventType.PODCAST_PLAY,
        AnalyticsEventType.PODCAST_PLAY,
        AnalyticsEventType.PODCAST_PLAY, // Play olayı daha fazla
        AnalyticsEventType.PODCAST_COMPLETE,
        AnalyticsEventType.PODCAST_FOLLOW,
        AnalyticsEventType.EPISODE_DOWNLOAD,
      ];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      // Saat rastgele ama gerçekçi (sabah 6-gece 12 arası)
      const hour = 6 + Math.floor(Math.random() * 18);
      const occurredAt = new Date(date);
      occurredAt.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      await prisma.analyticsEvent.create({
        data: {
          tenantId: tenant1.id,
          userId: randomUser.id,
          podcastId: randomEpisode.podcastId,
          episodeId: randomEpisode.id,
          eventType,
          occurredAt,
          metadata: {
            duration: eventType === AnalyticsEventType.PODCAST_PLAY ? randomEpisode.duration : null,
            device: ['web', 'ios', 'android'][Math.floor(Math.random() * 3)],
          },
        },
      });
      eventCount++;
    }
  }

  console.log(`✅ Created ${eventCount} analytics events\n`);

  // ==================== LISTENING PROGRESS ====================
  console.log('⏯️ Creating listening progress...');
  let progressCount = 0;

  for (const listener of listeners) {
    // Her dinleyici için 5-10 episode progress
    const progressCountPerUser = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < progressCountPerUser && i < publishedEpisodes.length; i++) {
      const episode = publishedEpisodes[i];
      const progressSeconds = Math.floor(Math.random() * episode.duration);
      const completed = progressSeconds >= episode.duration * 0.9; // %90'ı geçtiyse completed

      await prisma.listeningProgress.create({
        data: {
          tenantId: tenant1.id,
          userId: listener.id,
          episodeId: episode.id,
          progressSeconds,
          completed,
          playCount: 1 + Math.floor(Math.random() * 3),
          lastPlayedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        },
      });
      progressCount++;
    }
  }

  console.log(`✅ Created ${progressCount} listening progress records\n`);

  // ==================== FAVORITES ====================
  console.log('⭐ Creating favorites...');
  let favoriteCount = 0;

  for (const listener of listeners) {
    // Her dinleyici 2-5 podcast favorilere ekliyor
    const favCount = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < favCount && i < podcasts.length; i++) {
      const podcast = podcasts[i];
      if (podcast.isPublished) {
        await prisma.favorite.create({
          data: {
            tenantId: tenant1.id,
            userId: listener.id,
            podcastId: podcast.id,
          },
        });
        favoriteCount++;
      }
    }
  }

  console.log(`✅ Created ${favoriteCount} favorites\n`);

  // ==================== REVIEWS ====================
  console.log('⭐ Creating reviews...');
  let reviewCount = 0;

  const reviewTitles = [
    ['Mükemmel içerik!', 'Çok faydalı bilgiler', 'Kesinlikle dinleyin', 'Harika bir podcast', 'Müthiş anlatım'],
    ['İyi ama gelişebilir', 'Fena değil', 'Ortalama bir içerik', 'İdare eder', 'Beklediğim gibi değildi'],
    ['Vasat', 'Ne iyi ne kötü', 'Orta seviye', 'Fena sayılmaz', 'Standart içerik'],
  ];

  const reviewContents = [
    // 5 yıldız - çok pozitif
    [
      'Bu podcast gerçekten harika! İçerik kalitesi çok yüksek ve anlatım tarzı akıcı. Her bölümü zevkle dinliyorum. Kesinlikle tavsiye ederim.',
      'Mükemmel bir eğitim kaynağı. Konular detaylı işlenmiş ve örneklerle desteklenmiş. Podcast severler için mutlaka dinlenmeli.',
      'Şimdiye kadar dinlediğim en iyi podcastlardan biri. Sunucu çok bilgili ve anlatımı son derece profesyonel. 5 yıldız az bile!',
      'Harika içerikler üretiyorsunuz, elinize sağlık! Her bölüm beni bir şeyler öğretiyor. Çok teşekkür ederim.',
      'Kaliteli içerik arayanlar için birebir. Ses kalitesi mükemmel, konular güncel ve ilgi çekici. Herkese tavsiye ederim.',
    ],
    // 4 yıldız - pozitif
    [
      'Genel olarak çok beğendim. Bazı bölümler biraz uzun olabilir ama içerik kalitesi gayet iyi.',
      'İyi bir podcast. Konular ilginç seçilmiş, anlatım tarzı hoş. Bazen tekrarlara düşülebiliyor ama yine de dinlenir.',
      'Faydalı bilgiler içeriyor. Ses kalitesi iyi, içerik kaliteli. Biraz daha düzenli yayınlansa süper olur.',
      'Beğenerek dinliyorum. Konular güzel seçilmiş, örnekler yerinde. Tavsiye ederim.',
      'İyi içerikler üretiyorsunuz. Devamını bekliyorum, böyle devam edin.',
    ],
    // 3 yıldız - orta
    [
      'Ortalama bir podcast. Bazı bölümler güzel ama bazıları sıkıcı olabiliyor.',
      'Fena değil ama beklediğim gibi olmadı. Daha iyi olabilir.',
      'İdare eder. Konular ilginç ama anlatım biraz monoton.',
      'Ne çok iyi ne çok kötü. Dinlenebilir seviyede.',
      'Standart içerik. Özel bir şey yok ama kötü de sayılmaz.',
    ],
  ];

  const publishedPodcasts = podcasts.filter((p) => p.isPublished);

  // Her published podcast için 2-4 review oluştur
  for (const podcast of publishedPodcasts) {
    const reviewersCount = 2 + Math.floor(Math.random() * 3); // 2-4 review
    const selectedListeners = listeners.slice(0, reviewersCount);

    for (const listener of selectedListeners) {
      const rating = Math.random() < 0.7 ? 5 : Math.random() < 0.5 ? 4 : 3; // %70 5-yıldız, %15 4-yıldız, %15 3-yıldız
      const titleGroup = rating === 5 ? 0 : rating === 4 ? 0 : rating === 3 ? 2 : 1;
      const contentGroup = rating === 5 ? 0 : rating === 4 ? 1 : 2;

      const title = reviewTitles[titleGroup][Math.floor(Math.random() * reviewTitles[titleGroup].length)];
      const content = reviewContents[contentGroup][Math.floor(Math.random() * reviewContents[contentGroup].length)];

      await prisma.review.create({
        data: {
          tenantId: tenant1.id,
          userId: listener.id,
          podcastId: podcast.id,
          rating,
          title,
          content,
          isPublic: true,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Son 30 gün
        },
      });
      reviewCount++;
    }
  }

  console.log(`✅ Created ${reviewCount} reviews\n`);

  // ==================== PLAYLISTS ====================
  console.log('📝 Creating playlists...');
  let playlistCount = 0;
  let playlistEpisodeCount = 0;

  const playlistsData = [
    { name: 'En Sevdiklerim', description: 'Tekrar tekrar dinlediğim bölümler', isPublic: true },
    { name: 'Siyer Koleksiyonu', description: 'Siyer dersleri seçkisi', isPublic: true },
    { name: 'Fıkıh Notları', description: 'Fıkıh konularında önemli bölümler', isPublic: true },
    { name: 'Öğrenme Listesi', description: 'Henüz dinlemediğim bölümler', isPublic: false },
    { name: 'Yolda Dinle', description: 'Araba sürerken dinlemek için', isPublic: true },
    { name: 'Ramazan Hazırlık', description: 'Ramazan ayı için seçkiler', isPublic: true },
    { name: 'Aile Hayatı', description: 'Aile ve evlilik konuları', isPublic: true },
    { name: 'Gençlik Rehberi', description: 'Gençlere özel içerikler', isPublic: false },
  ];

  for (const listener of listeners) {
    // Her dinleyici 1-3 playlist oluşturuyor
    const playlistCountPerUser = 1 + Math.floor(Math.random() * 3);
    const shuffledPlaylists = [...playlistsData].sort(() => Math.random() - 0.5);

    for (let i = 0; i < playlistCountPerUser; i++) {
      const playlistData = shuffledPlaylists[i];
      const playlist = await prisma.playlist.create({
        data: {
          tenantId: tenant1.id,
          userId: listener.id,
          name: playlistData.name,
          description: playlistData.description,
          isPublic: playlistData.isPublic,
        },
      });
      playlistCount++;

      // Her playlist'e 3-8 episode ekle
      const episodesPerPlaylist = 3 + Math.floor(Math.random() * 6);
      const shuffledEpisodes = [...publishedEpisodes].sort(() => Math.random() - 0.5);

      for (let j = 0; j < episodesPerPlaylist && j < shuffledEpisodes.length; j++) {
        await prisma.playlistEpisode.create({
          data: {
            tenantId: tenant1.id,
            playlistId: playlist.id,
            episodeId: shuffledEpisodes[j].id,
            order: j + 1,
          },
        });
        playlistEpisodeCount++;
      }
    }
  }

  console.log(`✅ Created ${playlistCount} playlists with ${playlistEpisodeCount} episodes\n`);

  // ==================== DOWNLOADS ====================
  console.log('📥 Creating downloads...');
  let downloadCount = 0;

  for (const listener of listeners) {
    // Her dinleyici 3-8 episode indiriyor
    const downloadCountPerUser = 3 + Math.floor(Math.random() * 6);
    const shuffledEpisodes = [...publishedEpisodes].sort(() => Math.random() - 0.5);

    for (let i = 0; i < downloadCountPerUser && i < shuffledEpisodes.length; i++) {
      const episode = shuffledEpisodes[i];
      const status = Math.random() < 0.9 ? DownloadStatus.COMPLETED : DownloadStatus.PENDING;

      await prisma.download.create({
        data: {
          tenantId: tenant1.id,
          userId: listener.id,
          episodeId: episode.id,
          status,
          fileSize: episode.duration * 16000, // Yaklaşık bitrate hesabı
          completedAt: status === DownloadStatus.COMPLETED ? new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)) : null,
        },
      });
      downloadCount++;
    }
  }

  console.log(`✅ Created ${downloadCount} downloads\n`);

  // ==================== NOTIFICATIONS ====================
  console.log('🔔 Creating notifications...');
  let notificationCount = 0;

  const notificationTemplates = [
    { type: NotificationType.EPISODE_PUBLISHED, title: 'Yeni Bölüm!', body: (podcast: string) => `"${podcast}" serisine yeni bir bölüm eklendi.` },
    { type: NotificationType.NEW_FOLLOWER, title: 'Yeni Takipçi', body: () => 'Biri sizi takip etmeye başladı.' },
    { type: NotificationType.COMMENT_REPLY, title: 'Yorum Cevabı', body: () => 'Yorumunuza bir cevap geldi.' },
    { type: NotificationType.MENTION, title: 'Bahsedildiniz', body: () => 'Birisi sizi bir yorumda bahsetti.' },
    { type: NotificationType.SYSTEM, title: 'Sistem Bildirimi', body: () => 'Uygulama güncellendi! Yeni özellikler sizi bekliyor.' },
  ];

  // Son 30 gün için bildirimler oluştur
  for (let day = 0; day < 30; day++) {
    const notificationsPerDay = 5 + Math.floor(Math.random() * 10); // Günde 5-15 bildirim

    for (let n = 0; n < notificationsPerDay; n++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomPodcast = publishedPodcasts[Math.floor(Math.random() * publishedPodcasts.length)];
      const randomEpisode = publishedEpisodes[Math.floor(Math.random() * publishedEpisodes.length)];
      const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - day);
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const isRead = Math.random() < 0.6; // %60 okunmuş

      await prisma.notification.create({
        data: {
          tenantId: tenant1.id,
          userId: randomUser.id,
          type: template.type,
          title: template.title,
          payload: {
            body: template.body(randomPodcast?.title || randomEpisode?.title || ''),
            podcastId: randomPodcast?.id,
            episodeId: randomEpisode?.id,
          },
          readAt: isRead ? new Date(createdAt.getTime() + Math.floor(Math.random() * 3600000)) : null,
          podcastId: randomPodcast?.id,
          episodeId: randomEpisode?.id,
          createdAt,
        },
      });
      notificationCount++;
    }
  }

  console.log(`✅ Created ${notificationCount} notifications\n`);

  // ==================== PODCAST COLLABORATORS ====================
  console.log('👥 Creating podcast collaborators...');
  let collaboratorCount = 0;

  const creators = users.filter((u) => u.role === UserRole.HOCA);
  const editors = users.filter((u) => u.role === UserRole.ADMIN);

  // Her podcast için 1-2 collaborator ekle
  for (const podcast of publishedPodcasts.slice(0, 10)) {
    // İlk 10 podcast'e
    const collaboratorsPerPodcast = 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < collaboratorsPerPodcast; i++) {
      // Podcast owner olmayan birini seç
      const potentialCollaborators = [...creators, ...editors].filter((u) => u.id !== podcast.ownerId);
      if (potentialCollaborators.length === 0) continue;

      const collaborator = potentialCollaborators[Math.floor(Math.random() * potentialCollaborators.length)];
      const roles = [CollaboratorRole.CO_HOST, CollaboratorRole.EDITOR, CollaboratorRole.GUEST, CollaboratorRole.CONTRIBUTOR];
      const role = roles[Math.floor(Math.random() * roles.length)];

      try {
        await prisma.podcastCollaborator.create({
          data: {
            podcastId: podcast.id,
            userId: collaborator.id,
            role,
            status: CollaboratorStatus.ACCEPTED,
            permissions: {
              canEdit: role === CollaboratorRole.EDITOR || role === CollaboratorRole.CONTRIBUTOR,
              canPublish: role === CollaboratorRole.CONTRIBUTOR,
              canInvite: role === CollaboratorRole.CO_HOST,
            },
            invitedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
            acceptedAt: new Date(Date.now() - Math.floor(Math.random() * 25 * 24 * 60 * 60 * 1000)),
          },
        });
        collaboratorCount++;
      } catch {
        // Duplicate'ları atla
      }
    }
  }

  console.log(`✅ Created ${collaboratorCount} podcast collaborators\n`);

  // ==================== SCHEDULED EPISODES ====================
  console.log('📅 Creating scheduled episodes...');
  let scheduledCount = 0;

  // Yayınlanmamış episode'lardan bazılarını zamanlanmış yap
  const unpublishedEpisodes = await prisma.episode.findMany({
    where: { tenantId: tenant1.id, isPublished: false },
    take: 8,
  });

  for (const episode of unpublishedEpisodes) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1 + Math.floor(Math.random() * 14)); // 1-14 gün sonra
    scheduledDate.setHours(9 + Math.floor(Math.random() * 10), 0, 0, 0); // 09:00-19:00 arası

    await prisma.scheduledEpisode.create({
      data: {
        tenantId: tenant1.id,
        episodeId: episode.id,
        scheduledAt: scheduledDate,
        status: ScheduleStatus.PENDING,
      },
    });
    scheduledCount++;
  }

  console.log(`✅ Created ${scheduledCount} scheduled episodes\n`);

  // ==================== MODERATION QUEUE ====================
  console.log('🛡️ Creating moderation queue entries...');
  let moderationCount = 0;

  // Bazı yorumları moderation queue'ya ekle
  const allComments = await prisma.comment.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
  });

  const moderationReasons = [
    'Uygunsuz içerik bildirimi',
    'Spam olarak işaretlendi',
    'Reklam içeriği',
    'Hakaret içerebilir',
    'Otomatik spam filtresi',
  ];

  for (const comment of allComments.slice(0, 15)) {
    const status =
      Math.random() < 0.5 ? ModerationStatus.PENDING : Math.random() < 0.7 ? ModerationStatus.APPROVED : ModerationStatus.REJECTED;

    const reviewedBy = status !== ModerationStatus.PENDING ? editors[Math.floor(Math.random() * editors.length)] : null;

    await prisma.moderationQueue.create({
      data: {
        tenantId: tenant1.id,
        entityType: 'COMMENT',
        entityId: comment.id,
        commentId: comment.id,
        reason: moderationReasons[Math.floor(Math.random() * moderationReasons.length)],
        status,
        priority: Math.floor(Math.random() * 3) + 1, // 1-3
        moderatedBy: reviewedBy?.id ?? null,
        moderatedAt: reviewedBy ? new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) : null,
        notes:
          status === ModerationStatus.REJECTED
            ? 'İçerik kurallarına aykırı bulundu.'
            : status === ModerationStatus.APPROVED
              ? 'İncelendi, uygun görüldü.'
              : null,
      },
    });
    moderationCount++;
  }

  console.log(`✅ Created ${moderationCount} moderation queue entries\n`);

  // ==================== REVIEW HELPFUL VOTES ====================
  console.log('👍 Creating review helpful votes...');
  let voteCount = 0;

  const allReviews = await prisma.review.findMany({
    where: { isPublic: true },
    take: 30,
  });

  for (const review of allReviews) {
    // Her review'a 2-5 vote
    const votesPerReview = 2 + Math.floor(Math.random() * 4);
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    for (let i = 0; i < votesPerReview && i < shuffledUsers.length; i++) {
      const voter = shuffledUsers[i];
      if (voter.id === review.userId) continue; // Kendi review'una oy vermesin

      try {
        await prisma.reviewHelpfulVote.create({
          data: {
            tenantId: tenant1.id,
            reviewId: review.id,
            userId: voter.id,
            isHelpful: Math.random() < 0.85, // %85 helpful
          },
        });
        voteCount++;
      } catch {
        // Duplicate'ları atla
      }
    }
  }

  console.log(`✅ Created ${voteCount} review helpful votes\n`);

  // ==================== STORAGE ASSETS ====================
  console.log('📦 Creating storage assets...');
  let storageCount = 0;

  // Podcast cover images
  for (const podcast of podcasts) {
    await prisma.storageAsset.create({
      data: {
        tenantId: tenant1.id,
        userId: podcast.ownerId,
        podcastId: podcast.id,
        bucket: 'podcast-uploads',
        objectKey: `podcasts/${podcast.id}/cover.jpg`,
        url: `https://storage.podcast.app/podcasts/${podcast.id}/cover.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 150000 + Math.floor(Math.random() * 100000), // 150-250KB
        metadata: { originalName: `${podcast.title} Cover.jpg`, isPublic: true },
      },
    });
    storageCount++;
  }

  // Episode audio files (simulated)
  for (const episode of publishedEpisodes.slice(0, 20)) {
    await prisma.storageAsset.create({
      data: {
        tenantId: tenant1.id,
        userId: episode.hostId,
        episodeId: episode.id,
        bucket: 'podcast-uploads',
        objectKey: `episodes/${episode.id}/audio.mp3`,
        url: episode.audioUrl,
        mimeType: 'audio/mpeg',
        sizeBytes: episode.duration * 16000, // Yaklaşık 128kbps
        metadata: { originalName: `${episode.title}.mp3`, isPublic: true },
      },
    });
    storageCount++;
  }

  console.log(`✅ Created ${storageCount} storage assets\n`);

  // ==================== STREAMING SESSIONS ====================
  console.log('📡 Creating streaming sessions...');
  let streamingCount = 0;

  // Son 7 gün için tamamlanmış streaming session'ları
  for (let day = 0; day < 7; day++) {
    const sessionsPerDay = 1 + Math.floor(Math.random() * 3); // Günde 1-3 session

    for (let s = 0; s < sessionsPerDay; s++) {
      const host = creators[Math.floor(Math.random() * creators.length)];
      const podcast = publishedPodcasts[Math.floor(Math.random() * publishedPodcasts.length)];

      const startedAt = new Date();
      startedAt.setDate(startedAt.getDate() - day);
      startedAt.setHours(19 + Math.floor(Math.random() * 3), 0, 0, 0); // 19:00-22:00

      const duration = 30 + Math.floor(Math.random() * 90); // 30-120 dakika
      const endedAt = new Date(startedAt.getTime() + duration * 60 * 1000);

      await prisma.streamingSession.create({
        data: {
          tenantId: tenant1.id,
          podcastId: podcast.id,
          hostId: host.id,
          title: `Canlı Yayın: ${podcast.title}`,
          description: 'Canlı soru-cevap ve sohbet',
          status: StreamStatus.ENDED,
          startedAt,
          endedAt,
          viewerCount: 10 + Math.floor(Math.random() * 50),
        },
      });
      streamingCount++;
    }
  }

  // Aktif bir streaming session
  const activeHost = creators[0];
  const activePodcast = publishedPodcasts[0];
  await prisma.streamingSession.create({
    data: {
      tenantId: tenant1.id,
      podcastId: activePodcast.id,
      hostId: activeHost.id,
      title: `CANLI: ${activePodcast.title} Özel Yayını`,
      description: 'Şu an canlı yayındayız! Katılın.',
      status: StreamStatus.LIVE,
      startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 dakika önce başladı
      viewerCount: 25,
    },
  });
  streamingCount++;

  console.log(`✅ Created ${streamingCount} streaming sessions\n`);

  // ==================== AUDIT LOGS ====================
  console.log('📝 Creating audit logs...');
  let auditCount = 0;

  const auditActions = [
    { action: 'USER_LOGIN', entityType: 'User' },
    { action: 'USER_LOGOUT', entityType: 'User' },
    { action: 'PODCAST_CREATE', entityType: 'Podcast' },
    { action: 'PODCAST_UPDATE', entityType: 'Podcast' },
    { action: 'EPISODE_PUBLISH', entityType: 'Episode' },
    { action: 'COMMENT_DELETE', entityType: 'Comment' },
    { action: 'USER_ROLE_CHANGE', entityType: 'User' },
    { action: 'SETTINGS_UPDATE', entityType: 'Settings' },
  ];

  // Son 30 gün için audit log'ları
  for (let day = 0; day < 30; day++) {
    const logsPerDay = 5 + Math.floor(Math.random() * 15); // Günde 5-20 log

    for (let l = 0; l < logsPerDay; l++) {
      const actor = users[Math.floor(Math.random() * users.length)];
      const auditAction = auditActions[Math.floor(Math.random() * auditActions.length)];

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - day);
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      await prisma.auditLog.create({
        data: {
          tenantId: tenant1.id,
          userId: actor.id,
          action: auditAction.action,
          entityType: auditAction.entityType,
          entityId: crypto.randomUUID(),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          createdAt,
        },
      });
      auditCount++;
    }
  }

  console.log(`✅ Created ${auditCount} audit logs\n`);

  // ==================== TENANT API KEYS ====================
  console.log('🔑 Creating tenant API keys...');
  let apiKeyCount = 0;

  // Her tenant için API key oluştur
  const apiKeysData = [
    { name: 'Production API', keyPrefix: 'sk_live_', permissions: ['read', 'write'] },
    { name: 'Development API', keyPrefix: 'sk_test_', permissions: ['read'] },
    { name: 'Mobile App', keyPrefix: 'sk_mob_', permissions: ['read', 'write'] },
  ];

  for (const tenant of [tenant1, tenant2]) {
    for (const apiKeyData of apiKeysData) {
      const keyId = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
      const visibleKey = `${apiKeyData.keyPrefix}****${keyId.slice(-4)}`;
      const keyHash = await bcrypt.hash(keyId, 10);

      await prisma.tenantApiKey.create({
        data: {
          tenantId: tenant.id,
          name: apiKeyData.name,
          key: visibleKey,
          keyHash,
          permissions: apiKeyData.permissions,
          lastUsedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
          createdBy: adminUser.id,
        },
      });
      apiKeyCount++;
    }
  }

  console.log(`✅ Created ${apiKeyCount} API keys\n`);

  // ==================== LOGIN HISTORY ====================
  console.log('🔐 Creating login history...');
  let loginHistoryCount = 0;

  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Firefox/121.0',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
  ];

  const locations = [
    'Istanbul, TR',
    'Ankara, TR',
    'Izmir, TR',
    'Bursa, TR',
    'Antalya, TR',
    'Konya, TR',
    'Unknown',
  ];

  // Son 30 gün için login history oluştur
  for (let day = 0; day < 30; day++) {
    const loginsPerDay = 5 + Math.floor(Math.random() * 20); // Günde 5-25 login

    for (let l = 0; l < loginsPerDay; l++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const success = Math.random() < 0.92; // %92 başarılı giriş

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - day);
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      await prisma.loginHistory.create({
        data: {
          tenantId: tenant1.id,
          userId: randomUser.id,
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          success,
          failureReason: success ? null : ['Geçersiz şifre', 'Hesap kilitli', 'Bilinmeyen hata'][Math.floor(Math.random() * 3)],
          createdAt,
        },
      });
      loginHistoryCount++;
    }
  }

  console.log(`✅ Created ${loginHistoryCount} login history records\n`);

  // ==================== DEMO TENANT DATA ====================
  console.log('🎭 Creating demo tenant data...');

  // Demo tenant için admin kullanıcı
  let demoAdmin = await prisma.user.findFirst({
    where: { tenantId: tenant2.id, email: 'demo-admin@podcast.dev' },
  });

  if (!demoAdmin) {
    demoAdmin = await prisma.user.create({
      data: {
        email: 'demo-admin@podcast.dev',
        name: 'Demo Admin',
        tenantId: tenant2.id,
        passwordHash: simplePasswordHash,
        role: UserRole.ADMIN,
        emailVerified: true,
        bio: 'Demo platform yöneticisi',
      },
    });
  }

  // Demo tenant için kategori
  const demoCategory = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant2.id, slug: 'genel' } },
    update: { name: 'Genel' },
    create: {
      name: 'Genel',
      slug: 'genel',
      description: 'Genel içerikler',
      tenantId: tenant2.id,
      sortOrder: 0,
    },
  });

  // Demo tenant için hoca
  let demoHoca = await prisma.hoca.findFirst({
    where: { tenantId: tenant2.id, name: 'Demo Hoca' },
  });

  if (!demoHoca) {
    demoHoca = await prisma.hoca.create({
      data: {
        name: 'Demo Hoca',
        bio: 'Demo amaçlı oluşturulmuş içerik üreticisi',
        expertise: 'Demo Konular',
        tenantId: tenant2.id,
        isActive: true,
      },
    });
  }

  // Demo tenant için podcast
  let demoPodcast = await prisma.podcast.findFirst({
    where: { tenantId: tenant2.id, slug: 'demo-podcast' },
  });

  if (!demoPodcast) {
    demoPodcast = await prisma.podcast.create({
      data: {
        title: 'Demo Podcast',
        slug: 'demo-podcast',
        description: 'Demo tenant için örnek podcast',
        tenantId: tenant2.id,
        ownerId: demoAdmin.id,
        hocaId: demoHoca.id,
        isPublished: true,
        publishedAt: new Date(),
        language: 'tr',
        categories: {
          create: [{ categoryId: demoCategory.id }],
        },
      },
    });
  }

  // Demo podcast için episode
  const demoEpisodeCount = await prisma.episode.count({
    where: { podcastId: demoPodcast.id },
  });

  if (demoEpisodeCount === 0) {
    await prisma.episode.create({
      data: {
        title: 'Demo Bölüm 1',
        slug: 'demo-bolum-1',
        description: 'Demo podcast için örnek bölüm',
        tenantId: tenant2.id,
        podcastId: demoPodcast.id,
        hostId: demoAdmin.id,
        duration: 1800,
        audioUrl: 'https://storage.podcast.app/audio/demo/episode-1.mp3',
        isPublished: true,
        publishedAt: new Date(),
        episodeNumber: 1,
        seasonNumber: 1,
      },
    });
  }

  console.log('✅ Demo tenant data created\n');

  // ==================== SUMMARY ====================
  console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!\n');
  console.log('📋 Summary:');
  console.log(`  - Tenants: 2 (${tenant1.slug}, ${tenant2.slug})`);
  console.log(`  - Users: ${users.length + 2} (includes admin + demo admin)`);
  console.log(`  - Categories: ${categories.length + 1}`);
  console.log(`  - Hocas: ${hocas.length + 1}`);
  console.log(`  - Podcasts: ${podcasts.length + 1} (${podcasts.filter((p) => p.isPublished).length + 1} published)`);
  console.log(`  - Episodes: ${totalEpisodes + 1}`);
  console.log(`  - Follows: ${followCount}`);
  console.log(`  - Comments: ${commentCount}`);
  console.log(`  - Analytics Events: ${eventCount}`);
  console.log(`  - Listening Progress: ${progressCount}`);
  console.log(`  - Favorites: ${favoriteCount}`);
  console.log(`  - Reviews: ${reviewCount}`);
  console.log(`  - Playlists: ${playlistCount} (with ${playlistEpisodeCount} episodes)`);
  console.log(`  - Downloads: ${downloadCount}`);
  console.log(`  - Notifications: ${notificationCount}`);
  console.log(`  - Collaborators: ${collaboratorCount}`);
  console.log(`  - Scheduled Episodes: ${scheduledCount}`);
  console.log(`  - Moderation Queue: ${moderationCount}`);
  console.log(`  - Review Votes: ${voteCount}`);
  console.log(`  - Storage Assets: ${storageCount}`);
  console.log(`  - Streaming Sessions: ${streamingCount}`);
  console.log(`  - Audit Logs: ${auditCount}`);
  console.log(`  - API Keys: ${apiKeyCount}`);
  console.log(`  - Login History: ${loginHistoryCount}`);
  console.log('\n✅ Database is now populated with comprehensive test data!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
