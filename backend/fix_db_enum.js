const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting Plan Enum Fix...');
  try {
    // 1. Convert Enum to String (to allow value changes without constraint)
    console.log('1. Converting plan column to VARCHAR...');
    await prisma.$executeRawUnsafe(`ALTER TABLE tenants MODIFY COLUMN plan VARCHAR(191) DEFAULT 'START'`);
    
    // 2. Update old values (FREE, STARTER, etc) to 'START' (New Enum value)
    console.log('2. Updating values to START...');
    await prisma.$executeRawUnsafe(`UPDATE tenants SET plan = 'START'`);

    console.log('✅ Bridge migration successful! Now run prisma db push.');
  } catch (e) {
    console.error('❌ Error during fix:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
