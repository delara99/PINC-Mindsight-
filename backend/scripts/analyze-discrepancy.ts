import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ANÁLISE COMPARATIVA: Sistema vs Planilha do Especialista
 * 
 * Assignment ID: 2566dc46-df4e-4dba-aa96-bba4152fb200
 * Usuário: cristianoan04ii@gmail.com
 */

async function analyzeDiscrepancy() {
    console.log('='.repeat(80));
    console.log('ANÁLISE COMPARATIVA: Sistema vs Planilha');
    console.log('='.repeat(80));

    const assignmentId = '2566dc46-df4e-4dba-aa96-bba4152fb200';

    // 1. Buscar assignment e respostas
    const assignment = await prisma.assessmentAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            responses: {
                orderBy: { questionId: 'asc' }
            },
            assessment: {
                include: {
                    questions: {
                        orderBy: { sequence: 'asc' }
                    }
                }
            },
            result: true
        }
    });

    if (!assignment) {
        console.log('❌ Assignment não encontrado!');
        await prisma.$disconnect();
        return;
    }

    console.log(`\n📋 DADOS DO TESTE:\n`);
    console.log(`Assignment ID: ${assignment.id}`);
    console.log(`Total de respostas: ${assignment.responses.length}`);
    console.log(`Total de questões: ${assignment.assessment.questions.length}`);

    // 2. Criar mapeamento de questão ID para sequência
    const questionMap = new Map();
    assignment.assessment.questions.forEach(q => {
        questionMap.set(q.id, {
            sequence: q.sequence,
            text: q.text
        });
    });

    // 3. Listar todas as respostas com sequência
    console.log(`\n📊 RESPOSTAS DO USUÁRIO (Escala 1-4):\n`);
    console.log('Seq | Resposta | Questão (primeiras 50 chars)');
    console.log('-'.repeat(80));

    const sortedResponses = assignment.responses
        .map(r => ({
            questionId: r.questionId,
            answer: r.answer,
            sequence: questionMap.get(r.questionId)?.sequence || 0,
            text: questionMap.get(r.questionId)?.text || 'Questão não encontrada'
        }))
        .sort((a, b) => a.sequence - b.sequence);

    sortedResponses.forEach(r => {
        const questionPreview = r.text.substring(0, 50).padEnd(50);
        console.log(`${r.sequence.toString().padStart(3)} |    ${r.answer}     | ${questionPreview}`);
    });

    // 4. Buscar resultado calculado
    if (assignment.result) {
        console.log(`\n📊 SCORES CALCULADOS PELO SISTEMA:\n`);

        const scores = assignment.result.scores as any;

        console.log('Dimensão | Score Sistema');
        console.log('-'.repeat(50));

        Object.entries(scores).forEach(([key, value]: [string, any]) => {
            if (value.traitName && value.normalizedScore !== undefined) {
                console.log(`${value.traitName.padEnd(30)} | ${value.normalizedScore}`);
            }
        });
    }

    // 5. Comparação com planilha (valores que você forneceu)
    console.log(`\n📊 COMPARAÇÃO: Sistema vs Planilha do Especialista:\n`);
    console.log('Dimensão | Sistema | Planilha | Diferença');
    console.log('-'.repeat(70));

    const planilhaScores = {
        'CONCRETO-ABSTRATO': 84,
        'AMABILIDADE': 41,
        'ESTABILIDADE EMOCIONAL': 80,
        'ESTRUTURA': 51,
        'INTROVERSÃO-EXTROVER': 72,
        'EXTROVERSÃO': 66,
        'LÓGICO-SENTIMENTAL': 54
    };

    if (assignment.result) {
        const scores = assignment.result.scores as any;

        Object.entries(planilhaScores).forEach(([dimensionName, planilhaScore]) => {
            // Tentar encontrar dimensão correspondente
            const systemScore = Object.values(scores).find((s: any) =>
                s.traitName && s.traitName.includes(dimensionName.split('-')[0])
            ) as any;

            if (systemScore) {
                const diff = systemScore.normalizedScore - planilhaScore;
                const diffStr = diff > 0 ? `+${diff}` : diff.toString();
                console.log(`${dimensionName.padEnd(30)} |   ${systemScore.normalizedScore.toString().padStart(3)}   |   ${planilhaScore.toString().padStart(3)}    |   ${diffStr.padStart(4)}`);
            } else {
                console.log(`${dimensionName.padEnd(30)} |    ?    |   ${planilhaScore.toString().padStart(3)}    |    ?`);
            }
        });
    }

    // 6. Análise detalhada de uma faceta
    console.log(`\n🔍 ANÁLISE DETALHADA - Vamos calcular manualmente uma dimensão:\n`);

    // Buscar mapeamentos de questões
    const mappings = await prisma.questionMapping.findMany({
        where: {
            assessmentId: assignment.assessmentId
        }
    });

    console.log(`Total de mapeamentos encontrados: ${mappings.length}`);

    // Exemplo: CONCRETO-ABSTRATO
    const concretoAbstratoMappings = mappings.filter(m =>
        m.dimension === 'CONCRETO-ABSTRATO' ||
        m.dimension.includes('ABERTURA') ||
        m.dimension.includes('OPENNESS')
    );

    console.log(`\nMapeamentos para CONCRETO-ABSTRATO: ${concretoAbstratoMappings.length}`);

    if (concretoAbstratoMappings.length > 0) {
        console.log('\nQuestões dessa dimensão:');
        console.log('Seq | Resposta | Invertida? | Valor Mapeado | Após Inversão | Normalizado');
        console.log('-'.repeat(90));

        let sum = 0;
        let count = 0;

        concretoAbstratoMappings.forEach(mapping => {
            const response = sortedResponses.find(r => r.sequence === mapping.questionId);

            if (response) {
                const rawVal = response.answer || 0;

                // Mapeamento
                const valueMap: Record<number, number> = {
                    1: 0.05,
                    2: 1,
                    3: 2,
                    4: 2.95
                };

                let mappedValue = valueMap[rawVal] || 0.05;
                let afterReverse = mappedValue;

                if (mapping.isReversed) {
                    afterReverse = 3 - mappedValue;
                }

                const normalized = Math.round((afterReverse / 3) * 100);

                sum += normalized;
                count++;

                console.log(`${mapping.questionId.toString().padStart(3)} |    ${rawVal}     |    ${mapping.isReversed ? 'SIM' : 'NÃO'}     |     ${mappedValue.toFixed(2)}     |     ${afterReverse.toFixed(2)}      |     ${normalized}`);
            }
        });

        if (count > 0) {
            const average = Math.round(sum / count);
            console.log('\n' + '-'.repeat(90));
            console.log(`MÉDIA FINAL: ${average}`);
            console.log(`Planilha: ${planilhaScores['CONCRETO-ABSTRATO']}`);
            console.log(`Diferença: ${average - planilhaScores['CONCRETO-ABSTRATO']}`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('FIM DA ANÁLISE');
    console.log('='.repeat(80));

    await prisma.$disconnect();
}

analyzeDiscrepancy().catch(console.error);
