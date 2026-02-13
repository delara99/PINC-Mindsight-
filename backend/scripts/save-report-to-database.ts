import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SCRIPT SIMPLES: Salvar Scores no Banco
 */

async function saveScoresToDatabase() {
    console.log('='.repeat(80));
    console.log('SALVAMENTO: Salvar Scores no Banco de Dados');
    console.log('='.repeat(80));

    const assignmentId = '2566dc46-df4e-4dba-aa96-bba4152fb200';

    console.log(`\n📋 Assignment ID: ${assignmentId}\n`);

    // Importar serviço
    const { ScoreCalculationService } = await import('../src/reports/score-calculation.service');
    const { PrismaService } = await import('../src/prisma/prisma.service');

    const prismaService = new PrismaService();
    const scoreService = new ScoreCalculationService(prismaService);

    // 1. Calcular scores
    console.log('📊 Calculando scores...\n');
    const result = await scoreService.calculateScores(assignmentId);

    console.log('✅ Scores calculados:');
    Object.entries(result.scores).forEach(([key, score]) => {
        console.log(`   ${score.traitName}: ${score.normalizedScore}`);
    });

    // 2. Verificar se já existe
    const existing = await prisma.assessmentResult.findUnique({
        where: { assignmentId }
    });

    if (existing) {
        console.log('\n⚠️  Deletando resultado existente...');
        await prisma.assessmentResult.delete({
            where: { assignmentId }
        });
    }

    // 3. Salvar
    console.log('\n💾 Salvando no banco...\n');

    const saved = await prisma.assessmentResult.create({
        data: {
            assignmentId,
            scores: result.scores as any
        }
    });

    console.log('✅ Salvo com sucesso!');
    console.log(`   ID: ${saved.id}`);

    console.log('\n' + '='.repeat(80));
    console.log('SUCESSO!');
    console.log('='.repeat(80));
    console.log(`
✅ Relatório salvo no banco!

🔗 Acesse em:
   /dashboard/reports/${assignmentId}

⚠️ RECARREGUE A PÁGINA NO NAVEGADOR!
    `);

    await prisma.$disconnect();
}

saveScoresToDatabase().catch(console.error);
