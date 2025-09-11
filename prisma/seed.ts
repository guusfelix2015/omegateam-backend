import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.userCompanyParty.deleteMany();
  await prisma.companyParty.deleteMany();
  await prisma.user.deleteMany();

  // Create seed users
  const usersData = [
    {
      email: 'admin@lineage.com',
      name: 'Admin User',
      nickname: 'Admin',
      password: 'admin123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      isActive: true,
      lvl: 85,
      role: 'ADMIN' as const,
    },
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      nickname: 'JohnDoe',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      isActive: true,
      lvl: 45,
      role: 'PLAYER' as const,
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      nickname: 'JaneSmith',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      isActive: false,
      lvl: 20,
      role: 'PLAYER' as const,
    },
    // Additional 17 users to make 20 total
    {
      email: 'alice.wonder@example.com',
      name: 'Alice Wonder',
      nickname: 'AliceW',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      isActive: true,
      lvl: 32,
      role: 'PLAYER' as const,
    },
    {
      email: 'bob.builder@example.com',
      name: 'Bob Builder',
      nickname: 'BobB',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      isActive: false,
      lvl: 28,
      role: 'PLAYER' as const,
    },
    {
      email: 'charlie.brown@example.com',
      name: 'Charlie Brown',
      nickname: 'CharlieB',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      isActive: true,
      lvl: 55,
      role: 'PLAYER' as const,
    },
    {
      email: 'diana.prince@example.com',
      name: 'Diana Prince',
      nickname: 'DianaP',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
      isActive: true,
      lvl: 67,
      role: 'ADMIN' as const,
    },
    {
      email: 'edward.stark@example.com',
      name: 'Edward Stark',
      nickname: 'EdwardS',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=edward',
      isActive: false,
      lvl: 41,
      role: 'PLAYER' as const,
    },
    {
      email: 'fiona.green@example.com',
      name: 'Fiona Green',
      nickname: 'FionaG',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fiona',
      isActive: true,
      lvl: 73,
      role: 'PLAYER' as const,
    },
    {
      email: 'george.martin@example.com',
      name: 'George Martin',
      nickname: 'GeorgeM',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=george',
      isActive: true,
      lvl: 39,
      role: 'PLAYER' as const,
    },
    {
      email: 'helen.troy@example.com',
      name: 'Helen Troy',
      nickname: 'HelenT',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=helen',
      isActive: false,
      lvl: 52,
      role: 'PLAYER' as const,
    },
    {
      email: 'ivan.terrible@example.com',
      name: 'Ivan Terrible',
      nickname: 'IvanT',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan',
      isActive: true,
      lvl: 61,
      role: 'PLAYER' as const,
    },
    {
      email: 'julia.roberts@example.com',
      name: 'Julia Roberts',
      nickname: 'JuliaR',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julia',
      isActive: true,
      lvl: 48,
      role: 'PLAYER' as const,
    },
    {
      email: 'kevin.hart@example.com',
      name: 'Kevin Hart',
      nickname: 'KevinH',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin',
      isActive: false,
      lvl: 35,
      role: 'PLAYER' as const,
    },
    {
      email: 'laura.croft@example.com',
      name: 'Laura Croft',
      nickname: 'LauraC',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laura',
      isActive: true,
      lvl: 78,
      role: 'ADMIN' as const,
    },
    {
      email: 'mike.tyson@example.com',
      name: 'Mike Tyson',
      nickname: 'MikeT',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      isActive: true,
      lvl: 82,
      role: 'PLAYER' as const,
    },
    {
      email: 'nancy.drew@example.com',
      name: 'Nancy Drew',
      nickname: 'NancyD',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nancy',
      isActive: false,
      lvl: 29,
      role: 'PLAYER' as const,
    },
    {
      email: 'oscar.wilde@example.com',
      name: 'Oscar Wilde',
      nickname: 'OscarW',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oscar',
      isActive: true,
      lvl: 56,
      role: 'PLAYER' as const,
    },
    {
      email: 'peter.parker@example.com',
      name: 'Peter Parker',
      nickname: 'PeterP',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peter',
      isActive: true,
      lvl: 64,
      role: 'PLAYER' as const,
    },
    {
      email: 'queen.elizabeth@example.com',
      name: 'Queen Elizabeth',
      nickname: 'QueenE',
      password: 'user123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=queen',
      isActive: false,
      lvl: 90,
      role: 'ADMIN' as const,
    },
  ];

  const users = await Promise.all(
    usersData.map(userData => prisma.user.create({ data: userData }))
  );

  // Create sample Company Parties
  const companyParties = await Promise.all([
    prisma.companyParty.create({
      data: {
        name: 'Brazilian Storm',
      },
    }),
    prisma.companyParty.create({
      data: {
        name: 'Elite Warriors',
      },
    }),
    prisma.companyParty.create({
      data: {
        name: 'Shadow Hunters',
      },
    }),
  ]);

  // Add players to company parties
  const [admin, john, jane] = users;
  const [brazilianStorm, eliteWarriors, shadowHunters] = companyParties;

  // John joins Brazilian Storm and Elite Warriors
  await prisma.userCompanyParty.create({
    data: {
      userId: john.id,
      companyPartyId: brazilianStorm.id,
    },
  });

  await prisma.userCompanyParty.create({
    data: {
      userId: john.id,
      companyPartyId: eliteWarriors.id,
    },
  });

  // Jane joins Shadow Hunters
  await prisma.userCompanyParty.create({
    data: {
      userId: jane.id,
      companyPartyId: shadowHunters.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Created ${users.length} users:`);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
  });
  console.log(`Created ${companyParties.length} company parties:`);
  companyParties.forEach(cp => {
    console.log(`  - ${cp.name}`);
  });
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
