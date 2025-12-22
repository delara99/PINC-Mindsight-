const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    let output = '';
    try {
        const models = await prisma.assessmentModel.findMany({
            where: { type: 'BIG_FIVE' },
            select: { id: true, title: true, isDefault: true, tenantId: true, createdAt: true }
        });
        output = JSON.stringify(models, null, 2);
    } catch(e) {
        output = 'Error: ' + e.message;
    } finally {
        fs.writeFileSync('backend/defaults-check.txt', output);
        await prisma.$disconnect();
    }
}
run();
