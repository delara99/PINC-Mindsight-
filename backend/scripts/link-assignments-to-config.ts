import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function linkAssignmentsToActiveConfig() {
    console.log('\n🔗 VINCULANDO ASSIGNMENTS À CONFIG ATIVA\n');

    // 1. Buscar config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: { isActive: true }
    });

    if (!activeConfig) {
        console.log('❌ Nenhuma config ativa encontrada!');
        return;
    }

    console.log(`✅ Config ativa: ${activeConfig.name} (${activeConfig.id})`);

    // 2. Atualizar todos os assignments deste tenant para usar esta config
    const result = await prisma.assessmentAssignment.updateMany({
        where: {
            user: {
                tenantId: activeConfig.tenantId
            },
            status: 'COMPLETED'
        },
        data: {
            configId: activeConfig.id
        }
    });

    console.log(`\n✅ ${result.count} assignments vinculados à config ativa!`);
    console.log('\n🎯 AGORA os cálculos vão funcionar!\n');
}

linkAssignmentsToActiveConfig()
    .catch(e => console.error('❌ ERRO:', e))
    .finally(() => prisma.$disconnect());
