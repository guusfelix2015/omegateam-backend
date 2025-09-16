import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  // Create seed users with hashed passwords using PostgreSQL's crypt function
  await Promise.all([
    prisma.$executeRaw`
      INSERT INTO users (id, email, name, nickname, password, avatar, "isActive", lvl, role, "classeId", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'admin@lineage.com',
        'Admin User',
        'Admin',
        crypt('admin123456', gen_salt('bf', 12)),
        'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        true,
        85,
        'ADMIN',
        ${classes.find(c => c.name === 'Sorcerer')?.id},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `,
    prisma.$executeRaw`
      INSERT INTO users (id, email, name, nickname, password, avatar, "isActive", lvl, role, "classeId", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'player@lineage.com',
        'Regular Player',
        'Player',
        crypt('player123456', gen_salt('bf', 12)),
        'https://api.dicebear.com/7.x/avataaars/svg?seed=player',
        true,
        45,
        'PLAYER',
        ${classes.find(c => c.name === 'Gladiador')?.id},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `,
    prisma.$executeRaw`
      INSERT INTO users (id, email, name, nickname, password, avatar, "isActive", lvl, role, "classeId", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'leader@lineage.com',
        'CP Leader',
        'CPLeader',
        crypt('leader123456', gen_salt('bf', 12)),
        'https://api.dicebear.com/7.x/avataaars/svg?seed=leader',
        true,
        75,
        'CP_LEADER',
        ${classes.find(c => c.name === 'BladeDancer')?.id},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `,
  ]);

  // Get the created users for further operations
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@lineage.com', 'player@lineage.com', 'leader@lineage.com']
      }
    }
  });

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
