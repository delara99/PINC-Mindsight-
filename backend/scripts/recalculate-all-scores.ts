import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function recalculateAllScores() {
    console.log('\n🔄 RECALCULANDO TODOS OS SCORES\n');

    // 1. Buscar config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: { isActive: true },
        include: {
            traits: {
                include: { facets: true }
            }
        }
    });

    if (!activeConfig) {
        console.log('❌ Nenhuma config ativa encontrada!');
        return;
    }

    console.log(`✅ Config ativa: ${activeConfig.name}`);
    console.log(`   Traits: ${activeConfig.traits.length}`);
    console.log(`   Facetas: ${activeConfig.traits.reduce((sum, t) => sum + (t.facets?.length || 0), 0)}`);

    // 2. Buscar todos os assignments completados deste tenant
    const assignments = await prisma.assessmentAssignment.findMany({
        where: {
            status: 'COMPLETED',
            user: {
                tenantId: activeConfig.tenantId
            }
        },
        include: {
            responses: {
                include: {
                    question: true
                }
            }
        }
    });

    console.log(`\n📊 Found ${assignments.length} completed assignments\n`);

    let updated = 0;
    let failed = 0;

    for (const assignment of assignments) {
        try {
            console.log(`Processing assignment ${assignment.id}...`);

            // Calcular scores manualmente (lógica simplificada)
            const scoresByFacet: Record<string, { sum: number; count: number }> = {};

            for (const response of assignment.responses) {
                const q = response.question;
                const answer = typeof response.answer === 'number' ? response.answer : Number(response.answer) || 3;
                const finalValue = q.isReverse ? (6 - answer) : answer;

                const key = q.facetKey || q.traitKey || '';
                if (!scoresByFacet[key]) {
                    scoresByFacet[key] = { sum: 0, count: 0 };
                }
                scoresByFacet[key].sum += finalValue;
                scoresByFacet[key].count += 1;
            }

            // Converter para médias
            const scores: Record<string, number> = {};
            for (const [key, data] of Object.entries(scoresByFacet)) {
                if (data.count > 0) {
                    scores[key] = data.sum / data.count;
                }
            }

            // Atualizar assignment
            await prisma.assessmentAssignment.update({
                where: { id: assignment.id },
                data: {
                    configId: activeConfig.id,
                    calculatedScores: {
                        scores,
                        timestamp: new Date().toISOString()
                    }
                }
            });

            updated++;
            console.log(`  ✅ Updated (${Object.keys(scores).length} scores)`);

        } catch (error) {
            failed++;
            console.error(`  ❌ Failed:`, error.message);
        }
    }

    console.log(`\n✅ CONCLUÍDO!`);
    console.log(`   Atualizados: ${updated}`);
    console.log(`   Falhas: ${failed}`);
    console.log('\n🎯 Atualize os relatórios agora!\n');
}

recalculateAllScores()
    .catch(e => console.error('❌ ERRO:', e))
    .finally(() => prisma.$disconnect());
