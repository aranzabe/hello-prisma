const { faker } = require('@faker-js/faker');

async function seedRandomPosts(prisma, countPerUser = 3) {
  console.log('🌱 Seeding random posts...');

  const users = await prisma.user.findMany();

  if (!users.length) {
    console.warn('⚠️ No users found. Skipping random posts seed.');
    return;
  }

  const postsData = users.flatMap(user => {
    return Array.from({ length: countPerUser }).map(() => ({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      published: faker.datatype.boolean(),
      authorId: user.id,
    }));
  });

  await prisma.post.createMany({
    data: postsData,
    skipDuplicates: true,
  });

  console.log(`✅ Random posts seeded (${users.length * countPerUser} posts)`);
}

module.exports = { seedRandomPosts };
