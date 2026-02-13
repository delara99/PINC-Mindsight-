import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SCRIPT DE VALIDAÇÃO: Comparação de Fórmulas de Cálculo
 * 
 * Compara:
 * - Fórmula ATUAL (1-6, inversão 7-valor, normalização (v-1)/5*100)
 * - Fórmula ESPECIALISTA (1-4, valores 0.05/1/2/2.95, inversão 3-valor, normalização v/3*100)
 */

// ============================================================================
// FÓRMULA ATUAL (Sistema em Produção)
// ============================================================================
function calculateCurrentFormula(rawAnswer: number, isReversed: boolean): number {
    // Validação: escala 1-6
    let rawVal = rawAnswer;
    if (rawVal < 1) rawVal = 1;
    if (rawVal > 6) rawVal = 6;

    if (isReversed) {
        // Inversão: 7 - valor
        const inverted = 7 - rawVal;
        // Normalização: (val - 1) / 5 * 100
        return Math.round(((inverted - 1) / 5) * 100);
    } else {
        // Normalização direta
        return Math.round(((rawVal - 1) / 5) * 100);
    }
}

// ============================================================================
// FÓRMULA ESPECIALISTA (Nova Especificação)
// ============================================================================
function calculateSpecialistFormula(rawAnswer: number, isReversed: boolean): number {
    // Validação: escala 1-4
    let rawVal = rawAnswer;
    if (rawVal < 1) rawVal = 1;
    if (rawVal > 4) rawVal = 4;

    // Mapeamento de valores normalizados
    const valueMap: Record<number, number> = {
        1: 0.05,  // DISCORDO
        2: 1,     // DISCORDO PARCIALMENTE
        3: 2,     // CONCORDO PARCIALMENTE
        4: 2.95   // CONCORDO
    };

    let normalizedValue = valueMap[rawVal] || 0.05;

    if (isReversed) {
        // Inversão: 3 - valor
        normalizedValue = 3 - normalizedValue;
    }

    // Normalização: (valor / 3) * 100
    return Math.round((normalizedValue / 3) * 100);
}

// ============================================================================
// TESTE DE VALIDAÇÃO
// ============================================================================
async function validateFormulas() {
    console.log('='.repeat(80));
    console.log('VALIDAÇÃO: Comparação de Fórmulas de Cálculo');
    console.log('='.repeat(80));

    // Teste 1: Comparação de todas as respostas possíveis
    console.log('\n📊 TESTE 1: Comparação de Respostas (SEM INVERSÃO)\n');
    console.log('Resposta | Atual (1-6) | Especialista (1-4) | Diferença');
    console.log('-'.repeat(80));

    for (let i = 1; i <= 6; i++) {
        const current = calculateCurrentFormula(i, false);
        const specialist = i <= 4 ? calculateSpecialistFormula(i, false) : 'N/A';
        const diff = i <= 4 ? current - (specialist as number) : 'N/A';
        console.log(`   ${i}     |     ${current}      |        ${specialist}         |    ${diff}`);
    }

    console.log('\n📊 TESTE 2: Comparação de Respostas (COM INVERSÃO)\n');
    console.log('Resposta | Atual (1-6) | Especialista (1-4) | Diferença');
    console.log('-'.repeat(80));

    for (let i = 1; i <= 6; i++) {
        const current = calculateCurrentFormula(i, true);
        const specialist = i <= 4 ? calculateSpecialistFormula(i, true) : 'N/A';
        const diff = i <= 4 ? current - (specialist as number) : 'N/A';
        console.log(`   ${i}     |     ${current}      |        ${specialist}         |    ${diff}`);
    }

    // Teste 2: Buscar um assignment real e comparar
    console.log('\n📊 TESTE 3: Comparação com Assignment Real (Cristiano)\n');

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
            user: true,
            responses: true,
            assessment: {
                include: {
                    questions: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            }
        },
        orderBy: {
            completedAt: 'desc'
        }
    });

    if (!assignment) {
        console.log('⚠️  Nenhum assignment encontrado para teste');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Assignment: ${assignment.id}`);
    console.log(`👤 Usuário: ${assignment.user?.name || 'N/A'}`);
    console.log(`📅 Completado: ${assignment.completedAt}`);

    // Mapear questões
    const questionIdToSequence = new Map<string, number>();
    if (assignment.assessment?.questions) {
        assignment.assessment.questions.forEach((q, index) => {
            questionIdToSequence.set(q.id, index + 1);
        });
    }

    // Buscar mapeamentos
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isActive: true }
    });

    console.log('\n📋 Comparação de Scores por Questão (primeiras 10):\n');
    console.log('Q# | Resposta | Invertida? | Score Atual | Score Especialista | Diferença');
    console.log('-'.repeat(80));

    let count = 0;
    for (const response of assignment.responses) {
        if (count >= 10) break;

        const qSeq = questionIdToSequence.get(response.questionId);
        if (!qSeq) continue;

        const mapping = mappings.find(m => m.questionId === qSeq);
        if (!mapping) continue;

        const rawAnswer = response.answer || 0;
        const isReversed = mapping.isReversed;

        const currentScore = calculateCurrentFormula(rawAnswer, isReversed);
        const specialistScore = rawAnswer <= 4 ? calculateSpecialistFormula(rawAnswer, isReversed) : 'N/A';
        const diff = rawAnswer <= 4 ? currentScore - (specialistScore as number) : 'N/A';

        console.log(`${qSeq.toString().padStart(2)} |    ${rawAnswer}     |    ${isReversed ? 'SIM' : 'NÃO'}     |     ${currentScore}      |         ${specialistScore}          |    ${diff}`);
        count++;
    }

    // Teste 3: Calcular faceta completa
    console.log('\n📊 TESTE 4: Comparação de Faceta Completa (ouvinte-falante)\n');

    const facetResponses: Array<{ answer: number; isReversed: boolean }> = [];

    // Buscar todas as questões da faceta "ouvinte-falante"
    const facetMappings = mappings.filter(m =>
        m.facet.toLowerCase().includes('ouvinte') ||
        m.facet.toLowerCase().includes('falante')
    );

    console.log(`✅ Encontradas ${facetMappings.length} questões para faceta ouvinte-falante`);

    for (const mapping of facetMappings) {
        const qUUID = Array.from(questionIdToSequence.entries())
            .find(([_, seq]) => seq === mapping.questionId)?.[0];

        if (!qUUID) continue;

        const response = assignment.responses.find(r => r.questionId === qUUID);
        if (!response) continue;

        facetResponses.push({
            answer: response.answer || 0,
            isReversed: mapping.isReversed
        });
    }

    if (facetResponses.length > 0) {
        let currentSum = 0;
        let specialistSum = 0;

        facetResponses.forEach(({ answer, isReversed }) => {
            currentSum += calculateCurrentFormula(answer, isReversed);
            if (answer <= 4) {
                specialistSum += calculateSpecialistFormula(answer, isReversed);
            }
        });

        const currentAvg = Math.round(currentSum / facetResponses.length);
        const specialistAvg = Math.round(specialistSum / facetResponses.length);

        console.log(`\n📈 Média da Faceta:`);
        console.log(`   Fórmula Atual: ${currentAvg}`);
        console.log(`   Fórmula Especialista: ${specialistAvg}`);
        console.log(`   Diferença: ${currentAvg - specialistAvg}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO');
    console.log('='.repeat(80));
    console.log(`
⚠️  IMPORTANTE:
- Sistema atual usa escala 1-6
- Especialista especifica escala 1-4
- Respostas 5 e 6 não têm equivalente na nova fórmula
- Diferenças são esperadas devido às escalas diferentes

✅ PRÓXIMOS PASSOS:
1. Atualizar questionário para 4 opções
2. Implementar nova fórmula no motor de cálculo
3. Testar com novo assignment (respostas 1-4)
4. Validar resultados com especialista
    `);

    await prisma.$disconnect();
}

validateFormulas().catch(console.error);
