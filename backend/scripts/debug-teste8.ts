
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    const email = 'teste8@empresa.com';

    console.log(`--- DIAGNÓSTICO PARA: ${email} ---`);

    // Tenta buscar com 'assessmentAssignments' (padrão do prisma geralmente é o nome do modelo em lowerCamelCase)
    // Se falhar, pode ser que o schema tenha mapeado diferente, mas vamos tentar o padrão
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            assessmentAssignments: true
        }
    });

    if (!user) {
        console.error('Usuário não encontrado!');
        return;
    }

    console.log(`ID: ${user.id}`);
    console.log(`TenantID: ${user.tenantId}`);

    // @ts-ignore
    const assignments = user.assessmentAssignments || [];

    console.log(`\n--- ASSIGNMENTS (${assignments.length}) ---`);
    assignments.forEach((a: any) => {
        console.log(`ID: ${a.id}`);
        console.log(` - Status: ${a.status}`);
        console.log(` - ConfigID: ${a.configId ? a.configId : 'NULL (PROBLEMA!)'}`);
        console.log(` - AssessmentID: ${a.assessmentId}`);
        console.log(` - CompletedAt: ${a.completedAt}`);
    });

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
