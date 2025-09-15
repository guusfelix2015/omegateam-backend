import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Password utility functions
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.userCompanyParty.deleteMany();
  await prisma.companyParty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.classe.deleteMany();

  // Create classes
  const classesData = [
    'Gladiador',
    'Warlord',
    'Paladin',
    'Dark Avenger',
    'Treasure Hunter',
    'Hawkeye',
    'Sorcerer',
    'Necromancer',
    'Warlock',
    'Bishop',
    'Prophet',
    'Temple Knight',
    'Sword Singer',
    'PlainsWalker',
    'Silver Ranger',
    'Spell Singer',
    'Elemental Summoner',
    'Elven Elder',
    'Shillien Knight',
    'BladeDancer',
    'Abyss Walker',
    'Phantom Ranger',
    'Spell Howler',
    'Phantom Summoner',
    'Shillien Elder',
    'Destroyer',
    'Tyrant',
    'Overlord',
    'Warcryer',
    'Crafter',
    'Spoiler',
  ];

  const classes = await Promise.all(
    classesData.map(name =>
      prisma.classe.create({
        data: { name },
      })
    )
  );

  // Create seed users - simplified to 3 users only
  const usersData = [
    {
      email: 'admin@lineage.com',
      name: 'Admin User',
      nickname: 'Admin',
      password: await hashPassword('admin123'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      isActive: true,
      lvl: 85,
      role: 'ADMIN' as const,
      classeId: classes.find(c => c.name === 'Sorcerer')?.id, // Admin is a Sorcerer
    },
    {
      email: 'player@lineage.com',
      name: 'Regular Player',
      nickname: 'Player',
      password: await hashPassword('player123'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player',
      isActive: true,
      lvl: 45,
      role: 'PLAYER' as const,
      classeId: classes.find(c => c.name === 'Gladiador')?.id, // Player is a Gladiador
    },
    {
      email: 'leader@lineage.com',
      name: 'CP Leader',
      nickname: 'CPLeader',
      password: await hashPassword('leader123'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leader',
      isActive: true,
      lvl: 75,
      role: 'CP_LEADER' as const,
      classeId: classes.find(c => c.name === 'BladeDancer')?.id, // CP Leader is a BladeDancer
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
  const [player, cpLeader] = users;
  const [brazilianStorm, eliteWarriors, shadowHunters] = companyParties;

  // Verify users exist
  if (!player || !cpLeader) {
    throw new Error('Failed to create required users');
  }

  // Verify company parties exist
  if (!brazilianStorm || !eliteWarriors || !shadowHunters) {
    throw new Error('Failed to create required company parties');
  }

  // Regular Player joins Brazilian Storm
  await prisma.userCompanyParty.create({
    data: {
      userId: player.id,
      companyPartyId: brazilianStorm.id,
    },
  });

  // CP Leader joins Elite Warriors and Shadow Hunters (as leader)
  await prisma.userCompanyParty.create({
    data: {
      userId: cpLeader.id,
      companyPartyId: eliteWarriors.id,
    },
  });

  await prisma.userCompanyParty.create({
    data: {
      userId: cpLeader.id,
      companyPartyId: shadowHunters.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Created ${classes.length} classes:`);
  classes.forEach(classe => {
    console.log(`  - ${classe.name}`);
  });
  console.log(`Created ${users.length} users:`);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
  });
  console.log(`Created ${companyParties.length} cp:`);
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
