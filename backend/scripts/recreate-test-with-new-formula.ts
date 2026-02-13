import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SCRIPT DE MIGRAÇÃO: Recriar Teste do Cristiano com Nova Fórmula
 * 
 * 1. Busca teste antigo (12/02/2026)
 * 2. Converte respostas 1-6 para 1-4
 * 3. Cria novo assignment
 * 4. Aplica nova fórmula automaticamente
 * 5. Gera relatório
 */

// Mapeamento de respostas 1-6 para 1-4
function convertAnswer(oldAnswer: number): number {
    const conversionMap: Record<number, number> = {
        1: 1, // Discordo totalmente → Discordo
        2: 2, // Discordo → Discordo parcialmente
        3: 2, // Neutro (removido) → Discordo parcialmente
        4: 3, // Concordo → Concordo parcialmente
        5: 4, // Concordo totalmente → Concordo
        6: 4  // Extra → Concordo
    };

    return conversionMap[oldAnswer] || 2; // Default: Discordo parcialmente
}

async function recreateTestWithNewFormula() {
    console.log('='.repeat(80));
    console.log('MIGRAÇÃO: Recriar Teste do Cristiano com Nova Fórmula');
    console.log('='.repeat(80));

    // 1. Buscar teste antigo do Cristiano
    console.log('\n📋 ETAPA 1: Buscar teste antigo...\n');

    const oldAssignment = await prisma.assessmentAssignment.findFirst({
        where: {
            user: {
                email: 'cristianoan04ii@gmail.com'
            },
            status: 'COMPLETED'
        },
        include: {
            user: true,
            responses: true,
            assessment: true
        },
        orderBy: {
            completedAt: 'desc'
        }
    });

    if (!oldAssignment) {
        console.log('❌ Teste antigo não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Teste antigo encontrado:`);
    console.log(`   ID: ${oldAssignment.id}`);
    console.log(`   Usuário: ${oldAssignment.user.name} (${oldAssignment.user.email})`);
    console.log(`   Data: ${oldAssignment.completedAt}`);
    console.log(`   Respostas: ${oldAssignment.responses.length}`);

    // 2. Converter respostas
    console.log('\n📋 ETAPA 2: Converter respostas 1-6 → 1-4...\n');

    const convertedResponses = oldAssignment.responses.map(r => ({
        questionId: r.questionId,
        oldAnswer: r.answer,
        newAnswer: convertAnswer(r.answer || 0)
    }));

    console.log('Amostra de conversões (primeiras 10):');
    console.log('Q# | Resposta Antiga (1-6) | Resposta Nova (1-4)');
    console.log('-'.repeat(60));
    convertedResponses.slice(0, 10).forEach((r, i) => {
        console.log(`${(i + 1).toString().padStart(2)} |          ${r.oldAnswer}           |         ${r.newAnswer}`);
    });

    // 3. Criar novo assignment
    console.log('\n📋 ETAPA 3: Criar novo assignment...\n');

    const newAssignment = await prisma.assessmentAssignment.create({
        data: {
            userId: oldAssignment.userId,
            assessmentId: oldAssignment.assessmentId,
            status: 'COMPLETED',
            assignedAt: new Date(),
            completedAt: new Date(),
            responses: {
                create: convertedResponses.map(r => ({
                    questionId: r.questionId,
                    answer: r.newAnswer
                }))
            }
        }
    });

    console.log(`✅ Novo assignment criado:`);
    console.log(`   ID: ${newAssignment.id}`);

    // Buscar respostas criadas
    const responsesCount = await prisma.assessmentResponse.count({
        where: { assignmentId: newAssignment.id }
    });
    console.log(`   Respostas: ${responsesCount}`);

    // 4. Gerar relatório (trigger automático do sistema)
    console.log('\n📋 ETAPA 4: Gerar relatório...\n');

    // O sistema gera relatório automaticamente quando assignment é COMPLETED
    // Mas vamos forçar a geração chamando o serviço diretamente

    const { ScoreCalculationService } = await import('../src/reports/score-calculation.service');
    const { PrismaService } = await import('../src/prisma/prisma.service');

    const prismaService = new PrismaService();
    const scoreService = new ScoreCalculationService(prismaService);

    const scores = await scoreService.calculateScores(newAssignment.id);

    console.log('✅ Relatório gerado com sucesso!\n');
    console.log('📊 SCORES CALCULADOS (Nova Fórmula):\n');

    Object.entries(scores.scores).forEach(([key, result]) => {
        console.log(`🎯 ${result.traitName}: ${result.normalizedScore}`);
        if (result.facets && result.facets.length > 0) {
            console.log(`   Facetas (${result.facets.length} total):`);
            result.facets.slice(0, 5).forEach(f => {
                console.log(`   - ${f.facetName}: ${f.score}`);
            });
            if (result.facets.length > 5) {
                console.log(`   ... e mais ${result.facets.length - 5} facetas`);
            }
        }
        console.log('');
    });

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO');
    console.log('='.repeat(80));
    console.log(`
✅ SUCESSO!

📋 Teste Antigo:
   - ID: ${oldAssignment.id}
   - Fórmula: Antiga (1-6)
   - Status: Preservado (não alterado)

📋 Teste Novo:
   - ID: ${newAssignment.id}
   - Fórmula: Especialista (1-4)
   - Status: Pronto para validação

🔗 Acesse o relatório em:
   /dashboard/reports/${newAssignment.id}

⚠️ IMPORTANTE:
- Respostas foram convertidas de 1-6 para 1-4
- Nova fórmula aplicada automaticamente
- Scores podem ser diferentes (esperado)
- Teste antigo permanece inalterado
    `);

    await prisma.$disconnect();
}

recreateTestWithNewFormula().catch(console.error);
