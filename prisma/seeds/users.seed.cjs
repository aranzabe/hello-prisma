async function seedUsers(prisma) {
  console.log('🌱 Seeding users...');

  await prisma.user.createMany({
    data: [
      { email: 'admin@test.com', name: 'Admin' },
      { email: 'user1@test.com', name: 'User One' },
      { email: 'user2@test.com', name: 'User Two' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Users seeded');
}

module.exports = { seedUsers };
