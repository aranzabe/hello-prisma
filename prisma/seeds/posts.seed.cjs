async function seedPosts(prisma) {
  console.log('🌱 Seeding posts...');

  const users = await prisma.user.findMany();

  if (!users.length) {
    console.warn('⚠️ No users found. Skipping posts seed.');
    return;
  }

  const postsData = users.flatMap(user => [
    {
      title: `Welcome post for ${user.name ?? user.email}`,
      content: 'This is an auto-generated welcome post.',
      published: true,
      authorId: user.id,
    },
    {
      title: `Draft post for ${user.name ?? user.email}`,
      content: null,
      published: false,
      authorId: user.id,
    },
  ]);

  //Para tablas intermedias NO recomiendo createMany.
  await prisma.post.createMany({
    data: postsData,
    skipDuplicates: true,
  });

  console.log('✅ Posts seeded');
}

module.exports = { seedPosts };
