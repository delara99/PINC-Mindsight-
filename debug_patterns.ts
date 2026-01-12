
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching LOGIC patterns...");
    const patterns = await prisma.interpretationPattern.findMany({
        where: {
            code: {
                startsWith: 'LOGIC'
            }
        }
    });

    console.log(JSON.stringify(patterns, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
