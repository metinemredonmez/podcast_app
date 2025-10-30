import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

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
  const tenantSlug = process.env.ADMIN_TENANT_SLUG ?? 'default';
  const tenantName = process.env.ADMIN_TENANT_NAME ?? 'Default Tenant';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@podcast.dev';
  const adminName = process.env.ADMIN_NAME ?? 'Platform Admin';

  const passwordHash = await resolveAdminPasswordHash();

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: { name: tenantName, slug: tenantSlug },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      tenantId: tenant.id,
      name: adminName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      tenantId: tenant.id,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log(
    `✅ Seed complete. Tenant "${tenant.slug}" (${tenant.id}) ensured. Admin user ${adminUser.email} (${adminUser.id}) active.`,
  );
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
