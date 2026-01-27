
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'mysql://root:bjaxTxAWIBBniBfYxGwRGJXluqiKxsva@yamanote.proxy.rlwy.net:50133/railway'
        }
    }
});

async function main() {
    console.log("Checking EXTRAVERSION_AVG content...");
    const avg = await prisma.talkingToMessage.findUnique({
        where: { key: 'EXTRAVERSION_AVG' }
    });

    if (avg) {
        console.log("CONTENT:", avg.content);
    } else {
        console.log("Not found in DB (using code default: Diplomata Social).");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
