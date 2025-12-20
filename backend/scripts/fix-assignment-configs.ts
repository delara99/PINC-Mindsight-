import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAssignmentConfigs() {
    console.log('\n🔧 VINCULANDO ASSIGNMENTS À CONFIG ATIVA\n');

    // Buscar config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
    });

    if (!activeConfig) {
        console.log('❌ Nenhuma config ativa encontrada!');
        return;
    }

    console.log(`✅ Config ativa encontrada: ${activeConfig.name} (${activeConfig.id})`);

    // Atualizar todos os assignments sem config
    const updated = await prisma.assessmentAssignment.updateMany({
        where: {
            configId: null,
            user: {
                tenantId: activeConfig.tenantId
            }
        },
        data: {
            configId: activeConfig.id
        }
    });

    console.log(`✅ ${updated.count} assignments atualizados!`);

    // Também atualizar assignments com configs antigas
    const allConfigs = await prisma.bigFiveConfig.findMany({
        where: {
            tenantId: activeConfig.tenantId,
            isActive: false
        }
    });

    if (allConfigs.length > 0) {
        const updatedOld = await prisma.assessmentAssignment.updateMany({
            where: {
                configId: { in: allConfigs.map(c => c.id) }
            },
            data: {
                configId: activeConfig.id
            }
        });
        console.log(`✅ ${updatedOld.count} assignments com configs antigas atualizados!`);
    }

    console.log('\n🎯 CONCLUÍDO!');
}

fixAssignmentConfigs()
    .catch(e => {
        console.error('❌ ERRO:', e);
        console.error('Stack:', e.stack);
    })
    .finally(() => prisma.$disconnect());
