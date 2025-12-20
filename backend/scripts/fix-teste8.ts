import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTeste8() {
    console.log('🔧 INICIANDO CORREÇÃO DO TESTE8...\n');

    // 1. Encontrar teste8
    const teste8 = await prisma.user.findFirst({
        where: { email: 'teste8@empresa.com' }
    });

    if (!teste8) {
        console.log('❌ teste8@empresa.com não encontrado no banco');
        return;
    }

    console.log(`✅ Usuário encontrado: ${teste8.email} (ID: ${teste8.id})`);
    console.log(`   Tenant: ${teste8.tenantId}\n`);

    // 2. Buscar config ativa do tenant
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: {
            tenantId: teste8.tenantId,
            isActive: true
        },
        include: {
            traits: { include: { facets: true } }
        }
    });

    if (!activeConfig) {
        console.log('❌ ERRO: Nenhuma config Big Five ativa encontrada para o tenant');
        console.log('   Execute primeiro: npx ts-node scripts/populate-specific-config.ts');
        return;
    }

    console.log(`✅ Config ativa encontrada: ${activeConfig.id}`);
    console.log(`   Traços: ${activeConfig.traits.length}`);
    console.log(`   Facetas: ${activeConfig.traits.reduce((sum, t) => sum + t.facets.length, 0)}\n`);

    // 3. Buscar todos assignments do teste8
    const assignments = await prisma.assessmentAssignment.findMany({
        where: { userId: teste8.id },
        include: {
            assessment: { select: { id: true, title: true } }
        },
        orderBy: { assignedAt: 'desc' }
    });

    console.log(`📋 ${assignments.length} assignments encontrados:\n`);

    let fixed = 0;
    let skipped = 0;

    for (const assignment of assignments) {
        const result = (assignment as any).result;
        const hasScores = result?.scores && Object.keys(result.scores).length > 0;

        console.log(`Assignment: ${assignment.id}`);
        console.log(`  Assessment: ${assignment.assessment.title}`);
        console.log(`  Status: ${assignment.status}`);
        console.log(`  Config atual: ${assignment.configId || '❌ NENHUMA'}`);
        console.log(`  Scores: ${hasScores ? `✅ ${Object.keys(result.scores).length} facetas` : '❌ NENHUM'}`);

        // 4. Se está COMPLETED mas sem config ou sem scores, corrigir
        if (assignment.status === 'COMPLETED') {
            const needsFix = !assignment.configId || !hasScores;

            if (needsFix) {
                console.log('  🔧 CORRIGINDO...');

                // Vincular à config ativa
                await prisma.assessmentAssignment.update({
                    where: { id: assignment.id },
                    data: { configId: activeConfig.id }
                });

                console.log(`  ✅ Config vinculada: ${activeConfig.id}`);
                fixed++;

                // Se não tem scores, tentar recalcular (simplificado)
                if (!hasScores && assignment.status === 'COMPLETED') {
                    console.log('  ⚠️  Sem scores. Precisaria recalcular baseado em responses.');
                    console.log('      (Recálculo completo requer lógica adicional)');
                }
            } else {
                console.log('  ✓ Já está correto');
                skipped++;
            }
        } else {
            console.log('  - Não completado, pulando');
            skipped++;
        }

        console.log('');
    }

    console.log('\n════════════════════════════════════════');
    console.log(`✅ CORREÇÃO FINALIZADA!`);
    console.log(`   ✓ Corrigidos: ${fixed}`);
    console.log(`   - Pulados: ${skipped}`);
    console.log('════════════════════════════════════════\n');

    // 5. Verificação final
    const updatedAssignments = await prisma.assessmentAssignment.findMany({
        where: {
            userId: teste8.id,
            status: 'COMPLETED'
        }
    });

    console.log('📊 STATUS FINAL:');
    for (const a of updatedAssignments) {
        const result = (a as any).result;
        const hasScores = result?.scores && Object.keys(result.scores).length > 0;
        console.log(`  ${a.id}: Config=${a.configId ? '✅' : '❌'} | Scores=${hasScores ? '✅' : '❌'}`);
    }
}

fixTeste8()
    .catch((error) => {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
    })
    .finally(() => {
        console.log('\n🔌 Desconectando do banco...');
        prisma.$disconnect();
    });
