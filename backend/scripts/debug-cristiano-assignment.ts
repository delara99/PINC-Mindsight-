import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAssignment() {
    console.log('='.repeat(80));
    console.log('DEBUG: Cristiano Nascimento Assignment');
    console.log('='.repeat(80));

    // Buscar assignment por nome
    const assignment = await prisma.assessmentAssignment.findFirst({
        where: {
            user: {
                name: {
                    contains: 'Cristiano'
                }
            },
            status: 'COMPLETED'
        },
        include: {
            result: true,
            user: true
        },
        orderBy: {
            completedAt: 'desc'
        }
    });

    if (!assignment) {
        console.log('❌ Assignment não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log(`\n✅ Assignment encontrado: ${assignment.id}`);
    console.log(`📅 Completado em: ${assignment.completedAt}`);
    console.log(`👤 Usuário: ${assignment.user.name} (${assignment.user.email})`);

    if (!assignment.result) {
        console.log('\n❌ Resultado não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log('\n📊 SCORES SALVOS:');
    console.log('='.repeat(80));

    const scores = assignment.result.scores as any;

    Object.entries(scores).forEach(([dimension, data]: [string, any]) => {
        console.log(`\n🎯 ${dimension}: ${data.score}`);

        if (data.facets && data.facets.length > 0) {
            console.log(`   Facetas (${data.facets.length} total):`);
            data.facets.forEach((f: any) => {
                console.log(`   - ${f.facetName || f.name}: ${f.score || f.normalizedScore}`);
            });
        } else {
            console.log('   ⚠️  Sem facetas!');
        }
    });

    console.log('\n' + '='.repeat(80));
    await prisma.$disconnect();
}

debugAssignment().catch(console.error);
