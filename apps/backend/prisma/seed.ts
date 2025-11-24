import bcrypt from 'bcrypt';
import { PrismaClient, UserRole, AnalyticsEventType } from '@prisma/client';

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
      email: 'editor1@podcast.dev',
      name: 'Ahmet Yılmaz',
      role: UserRole.EDITOR,
      bio: 'İçerik editörü ve podcast moderatörü',
    },
    {
      email: 'editor2@podcast.dev',
      name: 'Ayşe Demir',
      role: UserRole.EDITOR,
      bio: 'Kıdemli içerik editörü',
    },
    {
      email: 'creator1@podcast.dev',
      name: 'Mehmet Kaya',
      role: UserRole.CREATOR,
      bio: 'Tarih ve kültür podcast içerik üreticisi',
    },
    {
      email: 'creator2@podcast.dev',
      name: 'Fatma Şahin',
      role: UserRole.CREATOR,
      bio: 'Din ve ahlak konularında içerik üreticisi',
    },
    {
      email: 'creator3@podcast.dev',
      name: 'Ali Özkan',
      role: UserRole.CREATOR,
      bio: 'Gençlik ve eğitim podcast yapımcısı',
    },
    {
      email: 'listener1@podcast.dev',
      name: 'Zeynep Arslan',
      role: UserRole.LISTENER,
      bio: 'Podcast meraklısı dinleyici',
    },
    {
      email: 'listener2@podcast.dev',
      name: 'Mustafa Çelik',
      role: UserRole.LISTENER,
      bio: 'Aktif podcast takipçisi',
    },
    {
      email: 'listener3@podcast.dev',
      name: 'Elif Yıldız',
      role: UserRole.LISTENER,
      bio: 'Düzenli dinleyici',
    },
    {
      email: 'listener4@podcast.dev',
      name: 'Burak Aydın',
      role: UserRole.LISTENER,
      bio: 'Yeni podcast keşfedici',
    },
    {
      email: 'listener5@podcast.dev',
      name: 'Selin Karaca',
      role: UserRole.LISTENER,
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
    const hoca = await prisma.hoca.create({
      data: {
        ...hocaData,
        tenantId: tenant1.id,
        isActive: true,
      },
    });
    hocas.push(hoca);
  }

  console.log(`✅ Created ${hocas.length} hocas\n`);

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
    const podcast = await prisma.podcast.create({
      data: {
        title: podcastData.title,
        slug: podcastData.slug,
        description: podcastData.description,
        tenantId: tenant1.id,
        ownerId: users[podcastData.ownerIndex].id,
        // Note: hocaId kolonu şu an DB'de yok, schema güncellemesi gerekiyor
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
  const listeners = users.filter((u) => u.role === UserRole.LISTENER);
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

  // ==================== SUMMARY ====================
  console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!\n');
  console.log('📋 Summary:');
  console.log(`  - Tenants: 2`);
  console.log(`  - Users: ${users.length + 1} (1 admin + ${users.length} others)`);
  console.log(`  - Categories: ${categories.length}`);
  console.log(`  - Hocas: ${hocas.length}`);
  console.log(`  - Podcasts: ${podcasts.length} (${podcasts.filter((p) => p.isPublished).length} published)`);
  console.log(`  - Episodes: ${totalEpisodes}`);
  console.log(`  - Follows: ${followCount}`);
  console.log(`  - Comments: ${commentCount}`);
  console.log(`  - Analytics Events: ${eventCount}`);
  console.log(`  - Listening Progress: ${progressCount}`);
  console.log(`  - Favorites: ${favoriteCount}`);
  console.log(`  - Reviews: ${reviewCount}`);
  console.log('\n✅ Database is now populated with realistic data!\n');
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
