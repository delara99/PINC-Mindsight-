
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    const email = 'teste8@empresa.com';

    console.log(`--- DIAGNÓSTICO V3 PARA: ${email} ---`);

    // 1. Busca Usuário
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('Usuário não encontrado!');
        return;
    }

    console.log(`ID: ${user.id}`);
    console.log(`TenantID: ${user.tenantId}`);

    // 2. Busca Assignments separadamente (evita erro de include)
    const assignments = await prisma.assessmentAssignment.findMany({
        where: { userId: user.id }
    });

    console.log(`\n--- ASSIGNMENTS (${assignments.length}) ---`);
    assignments.forEach((a: any) => {
        console.log(`ID: ${a.id}`);
        console.log(` - Status: ${a.status}`);
        console.log(` - ConfigID: ${a.configId ? a.configId : 'NULL (PROBLEMA!)'}`);
        console.log(` - AssessmentID: ${a.assessmentId}`);
        // console.log(` - CompletedAt: ${a.completedAt}`);
    });

    if (assignments.length === 0) {
        console.log('⚠️ AVISO: Usuário existe mas não tem nenhum assignment!');
        console.log('Isso explica por que o fix dizia "0 corrigidos".');
        console.log('O usuário precisa FINALIZAR um assessment antes.');
    }

    console.log(`\n--- CONFIGS DO TENANT ---`);
    const configs = await prisma.bigFiveConfig.findMany({
        where: { tenantId: user.tenantId }
    });

    configs.forEach(c => {
        console.log(`ID: ${c.id}`);
        console.log(` - Active: ${c.isActive}`);
        console.log(` - Name: ${c.name}`);
    });
}

debug()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
