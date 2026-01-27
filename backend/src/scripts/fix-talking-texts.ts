
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("--- CLEANING UP BAD TALKING TO MESSAGES ---");

    const keysToReset = [
        'EXTRAVERSION_AVG',
        'AGREEABLENESS_AVG',
        'CONSCIENTIOUSNESS_AVG',
        'OPENNESS_AVG',
        'NEUROTICISM_AVG',
        // Incluir LOW e HIGH se estiverem ruins também, mas o usuário reclamou dos Flex (médios)
    ];

    for (const key of keysToReset) {
        const msg = await prisma.talkingToMessage.findUnique({ where: { key } });
        if (msg) {
            console.log(`Checking ${key}:`);
            console.log(`   Current Content: ${msg.content.substring(0, 50)}...`);

            // Check signature of bad text (starts with "1 " or is generic "equilibrada")
            if (msg.content.startsWith('1 ') || msg.content.includes('equilibrada em termos de')) {
                console.log(`   🚨 BAD CONTENT DETECTED. DELETING...`);
                await prisma.talkingToMessage.delete({ where: { key } });
                console.log(`   ✅ Deleted. System will regenerate with code default on next call.`);
            } else {
                console.log(`   Type seems OK (or different bad). Skipping auto-delete to be safe.`);
            }
        } else {
            console.log(`Key ${key} not found (will use default).`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
