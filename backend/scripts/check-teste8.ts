import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Investigando teste8@empresa.com...\n');

    const user = await prisma.user.findFirst({
        where: { email: 'teste8@empresa.com' }
    });

    if (!user) {
        console.log('❌ Usuário não encontrado');
        return;
    }

    console.log(`✅ Usuário: ${user.email} (${user.id})\n`);

    const assignments = await prisma.assessmentAssignment.findMany({
        where: { userId: user.id }
    });

    console.log(`📋 ${assignments.length} assignments encontrados:\n`);

    for (const a of assignments) {
        const result = (a as any).result;
        console.log(`ID: ${a.id}`);
        console.log(`  AssessmentID: ${a.assessmentId}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  Config: ${a.configId || '❌ NENHUMA'}`);
        console.log(`  Result: ${result ? '✅ SIM' : '❌ NÃO'}`);
        if (result?.scores) {
            const scoresCount = Object.keys(result.scores).length;
            console.log(`  Scores: ✅ ${scoresCount} facetas`);
            console.log(`  Exemplo: ${Object.keys(result.scores)[0]}`);
        } else {
            console.log(`  Scores: ❌ NENHUM`);
        }
        console.log('');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
