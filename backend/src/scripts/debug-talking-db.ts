
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("--- DEBUGGING TALKING TO MESSAGES ---");

    // 1. Search for 'Diplomata' in TalkingToMessage
    console.log("\n1. SEARCH FOR 'Diplomata':");
    const dip = await prisma.talkingToMessage.findMany({
        where: { content: { contains: 'Diplomata' } }
    });

    if (dip.length > 0) {
        console.log(`✅ FOUND ${dip.length} matches!`);
        dip.forEach(d => {
            console.log(`   Key: ${d.key} | Group: ${d.group}`);
            console.log(`   Content: ${d.content.substring(0, 100)}...`);
        });
    } else {
        console.log("❌ NOT FOUND 'Diplomata' in TalkingToMessage.");
    }

    // 2. Search for '[Auto]' to see if it's polluted
    console.log("\n2. SEARCH FOR '[Auto]':");
    const auto = await prisma.talkingToMessage.findMany({
        where: { content: { contains: '[Auto]' } }
    });
    console.log(`Found ${auto.length} messages with '[Auto]'.`);

    // 3. Check keys for EXTRAVERSION to match Service logic
    console.log("\n3. EXTRAVERSION KEYS:");
    const extra = await prisma.talkingToMessage.findMany({
        where: { key: { contains: 'EXTRAVERSION' } }
    });
    extra.forEach(e => {
        console.log(`   [${e.key}]: ${e.content.substring(0, 50)}...`);
    });

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
