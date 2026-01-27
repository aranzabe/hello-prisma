require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const { seedUsers } = require('./users.seed.cjs');
const { seedPosts } = require('./posts.seed.cjs');
const { seedRandomPosts } = require('./posts-random.seed.cjs');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:Chubaca2025@localhost:5432/ejemploPrisma?schema=public"
  }),
});

async function main() {
  console.log('🌱 Starting database seed...');

  await seedUsers(prisma);
  await seedPosts(prisma);

  // Seed aleatorio extra
  await seedRandomPosts(prisma, 5); // 5 posts aleatorios por usuario

  console.log('🌱 Database seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
