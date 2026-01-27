
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("--- DEBUGGING BIG FIVE CONFIG ---");

    const configs = await prisma.bigFiveConfig.findMany({
        where: { isActive: true },
        include: { interpretativeTexts: true }
    });

    console.log(`Found ${configs.length} active configs.`);

    for (const config of configs) {
        console.log(`Config: ${config.name} (ID: ${config.id})`);
        console.log(` - Texts Count: ${config.interpretativeTexts.length}`);

        // Search inside this config's texts
        const diplomatText = config.interpretativeTexts.find(t => t.text.includes('Diplomata') || t.text.includes('diplomata'));
        if (diplomatText) {
            console.log(` ✅ Found 'Diplomata' inside config ${config.name}!`);
            console.log(`    Key: ${diplomatText.traitKey}`);
            console.log(`    Range: ${diplomatText.scoreRange}`);
            console.log(`    Category: ${diplomatText.category}`);
            console.log(`    Text Preview: ${diplomatText.text.substring(0, 100)}...`);
        } else {
            console.log(` ❌ 'Diplomata' NOT found in this config.`);
        }
    }

    // Search globally again but broader
    console.log("\n--- BROADER SEARCH ---");
    const broad = await prisma.bigFiveInterpretativeText.findFirst({
        where: {
            OR: [
                { text: { contains: 'Diplomata' } },
                { text: { contains: 'diplomata' } }
            ]
        }
    });

    if (broad) {
        console.log("Found broadly:", broad.id, broad.text.substring(0, 50));
    } else {
        console.log("Still not found globally.");
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
