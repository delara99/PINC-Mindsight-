const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running pre-deploy DB fixes...');
  
  try {
    // 1. Fix 'tenants' table (mapped name for Tenant model)
    // Convert to VARCHAR to allow overwrite of old ENUM values
    console.log('Fixing tenants table...');
    await prisma.$executeRawUnsafe(`ALTER TABLE tenants MODIFY COLUMN plan VARCHAR(191) DEFAULT 'START'`);
    await prisma.$executeRawUnsafe(`UPDATE tenants SET plan = 'START'`);
    console.log('Tenants fixed.');
  } catch (e) {
    console.log('Tenants fix skipped or failed (might not need fix):', e.message);
  }

  try {
    // 2. Fix 'User' table (default name for User model)
    // Try both 'User' and 'user' just in case of case sensitivity issues
    console.log('Fixing User table...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE User MODIFY COLUMN plan VARCHAR(191) DEFAULT 'START'`);
        await prisma.$executeRawUnsafe(`UPDATE User SET plan = 'START'`);
    } catch (e) {
        // Fallback to lowercase 'user' if capital fails
        await prisma.$executeRawUnsafe(`ALTER TABLE user MODIFY COLUMN plan VARCHAR(191) DEFAULT 'START'`);
        await prisma.$executeRawUnsafe(`UPDATE user SET plan = 'START'`);
    }
    console.log('User table fixed.');
  } catch (e) {
    console.log('User fix skipped (might not exist yet):', e.message);
  }

  console.log('Pre-deploy fixes complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
