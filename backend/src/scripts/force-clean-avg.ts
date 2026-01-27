
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("--- FORCE CLEANING AVERAGE TEXTS ---");

    const keysToReset = [
        'AGREEABLENESS_AVG',
        'CONSCIENTIOUSNESS_AVG',
        'OPENNESS_AVG',
        'NEUROTICISM_AVG'
    ];

    for (const key of keysToReset) {
        const msg = await prisma.talkingToMessage.findUnique({ where: { key } });
        if (msg) {
            console.log(`Checking ${key}:`);
            // Check for genérico pattern
            if (msg.content.includes('equilibrada') || msg.content.includes('capaz de lidar') || msg.content.includes('Você é capaz de')) {
                console.log(`   🚨 GENERIC CONTENT DETECTED. DELETING...`);
                await prisma.talkingToMessage.delete({ where: { key } });
                console.log(`   ✅ Deleted.`);
            }
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
