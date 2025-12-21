
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    const email = 'teste8@empresa.com'; // O EMAIL DO USUÁRIO QUE ESTÁ DANDO ERRADO

    console.log(`Buscando usuário ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('Usuário não encontrado!');
        return;
    }

    console.log(`Usuário encontrado: ${user.id} (Tenant: ${user.tenantId})`);

    // Busca config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: {
            tenantId: user.tenantId,
            isActive: true
        }
    });

    if (!activeConfig) {
        console.error('Nenhuma config ativa encontrada para este tenant!');

        // Tenta achar qualquer config
        const anyConfig = await prisma.bigFiveConfig.findFirst({
            where: { tenantId: user.tenantId }
        });

        if (anyConfig) {
            console.log(`Usando config inativa como fallback: ${anyConfig.id}`);
        } else {
            console.error('CRÍTICO: Nenhuma config Big Five existe. Crie uma primeiro!');
            return;
        }
    } else {
        console.log(`Config ativa encontrada: ${activeConfig.id}`);
    }

    const configToUse = activeConfig || (await prisma.bigFiveConfig.findFirst({ where: { tenantId: user.tenantId } }));

    // Busca assignments problemáticos
    const assignments = await prisma.assessmentAssignment.findMany({
        where: {
            userId: user.id,
            status: 'COMPLETED',
            OR: [
                { configId: null },
                { configId: '' }
            ]
        }
    });

    console.log(`Encontrados ${assignments.length} assignments sem config.`);

    for (const assignment of assignments) {
        console.log(`Corrigindo assignment ${assignment.id}...`);
        await prisma.assessmentAssignment.update({
            where: { id: assignment.id },
            data: { configId: configToUse?.id }
        });
    }

    console.log('✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
}

fix()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
