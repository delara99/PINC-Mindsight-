import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

const CONFIG_ID = 'b8d11272-fb89-4284-b51d-991486e05a45';

async function linkAssignmentsToSpecificConfig() {
    console.log('\n🔗 VINCULANDO ASSIGNMENTS À CONFIG ESPECÍFICA\n');

    const config = await prisma.bigFiveConfig.findUnique({
        where: { id: CONFIG_ID }
    });

    if (!config) {
        console.log('❌ Config não encontrada!');
        return;
    }

    console.log(`✅ Config: ${config.name} (${config.id})`);

    const result = await prisma.assessmentAssignment.updateMany({
        where: {
            user: {
                tenantId: config.tenantId
            },
            status: 'COMPLETED'
        },
        data: {
            configId: config.id
        }
    });

    console.log(`\n✅ ${result.count} assignments vinculados!`);
    console.log('\n🎯 Atualize os relatórios agora!\n');
}

linkAssignmentsToSpecificConfig()
    .catch(e => console.error('❌ ERRO:', e))
    .finally(() => prisma.$disconnect());
