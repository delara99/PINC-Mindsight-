const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('--- ASSESSMENT MODELS ---');
        const models = await prisma.assessmentModel.findMany({
            where: { type: 'BIG_FIVE' },
            select: { id: true, title: true, isDefault: true, tenantId: true, createdAt: true }
        });
        console.log(JSON.stringify(models, null, 2));
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
