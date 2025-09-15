#!/usr/bin/env tsx

/**
 * Script to hash existing plain text passwords in the database
 * This should be run once after implementing password hashing
 */

import { PrismaClient } from '@prisma/client';
import { PasswordUtils } from '../src/libs/password.js';

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  console.log('🔐 Starting password hashing migration...');

  try {
    // Get all users with plain text passwords
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    console.log(`📊 Found ${users.length} users to process`);

    let hashedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (!user.password) {
        console.log(`⚠️  Skipping user ${user.email} - no password set`);
        skippedCount++;
        continue;
      }

      // Check if password is already hashed
      if (PasswordUtils.isHashed(user.password)) {
        console.log(`✅ Skipping user ${user.email} - password already hashed`);
        skippedCount++;
        continue;
      }

      // Hash the plain text password
      console.log(`🔄 Hashing password for user: ${user.email}`);
      const hashedPassword = await PasswordUtils.hash(user.password);

      // Update the user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      hashedCount++;
      console.log(`✅ Password hashed for user: ${user.email}`);
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Passwords hashed: ${hashedCount}`);
    console.log(`⏭️  Passwords skipped: ${skippedCount}`);
    console.log(`📊 Total users processed: ${users.length}`);

    if (hashedCount > 0) {
      console.log('\n🎉 Password hashing migration completed successfully!');
      console.log('🔒 All user passwords are now securely hashed.');
    } else {
      console.log('\n✨ No passwords needed hashing - all were already secure!');
    }

  } catch (error) {
    console.error('❌ Error during password hashing migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
hashExistingPasswords()
  .then(() => {
    console.log('🏁 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
