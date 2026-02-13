import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SCRIPT: Debug Detalhado de Dimensão
 * Calcula e mostra valores linha a linha para entender discrepância
 */

async function debugDimension() {
    console.log('='.repeat(80));
    console.log('🐞 DEBUG DE DIMENSÃO: ADAPTÁVEL-ESTRUTURADO');
    console.log('='.repeat(80));

    // Assignment recente do fix-calculation-engine
    const assignmentId = '087af312-9018-4693-91a3-a7530dce0626'; // ID do log anterior

    // 1. Buscar respostas e mappings
    // Preciso cruzar AssessmentAssignment -> responses -> question -> mapping
    // Mas o mapping é por questionId (int), e responses tem questionId (uuid)
    // Vou buscar o assignment e as questões

    const assignment = await prisma.assessmentAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            responses: {
                include: { question: true }
            },
            assessment: {
                include: { questions: { orderBy: { createdAt: 'asc' } } }
            }
        }
    });

    if (!assignment) {
        console.log('❌ Assignment não encontrado');
        return;
    }

    // Mapear sequence (1-126) -> mapping
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: {
            dichotomy: { contains: 'ESTRUTURADO' } // Busca pela string da planilha
        }
    });

    const mappingMap = new Map(mappings.map(m => [m.questionId, m]));

    // Mapear sequence -> uuid
    const seqToUuid = new Map();
    assignment.assessment.questions.forEach((q, idx) => {
        seqToUuid.set(idx + 1, q.id);
    });

    // Mapear uuid -> sequence
    const uuidToSeq = new Map();
    assignment.assessment.questions.forEach((q, idx) => {
        uuidToSeq.set(q.id, idx + 1);
    });

    console.log(`\nQuestões mapeadas para ADAPTÁVEL-ESTRUTURADO: ${mappings.length}`);

    // Listar valores
    const data = [];
    const facetas: Record<string, number[]> = {};

    for (const m of mappings) {
        const qUuid = seqToUuid.get(m.questionId);
        const response = assignment.responses.find(r => r.questionId === qUuid);

        if (response) {
            const val = response.answer;
            let norm = 0;

            // Lógica de cálculo MANUAL para verificação
            // 1. Map (Identidade)
            let mapped = val;

            // 2. Reverse
            let reversed = mapped;
            if (m.isReversed) {
                reversed = 5 - mapped;
            }

            // 3. Normalize
            // 1->25, 2->50, 3->75, 4->100
            if (reversed === 1) norm = 25;
            else if (reversed === 2) norm = 50;
            else if (reversed === 3) norm = 75;
            else if (reversed === 4) norm = 100;

            data.push({
                q: m.questionId,
                text: m.questionText,
                facet: m.facet,
                inv: m.isReversed,
                resp: val,
                norm: norm
            });

            if (!facetas[m.facet || 'Unknown']) facetas[m.facet || 'Unknown'] = [];
            facetas[m.facet || 'Unknown'].push(norm);
        }
    }

    // Ordenar e exibir tabela
    console.log('\nQ   | Resp | Inv? | Norm | Faceta');
    console.log('-'.repeat(60));

    data.sort((a, b) => a.q - b.q).forEach(Row => {
        console.log(`${Row.q.toString().padStart(3)} |  ${Row.resp}   |  ${Row.inv ? 'S' : 'N'}   | ${Row.norm.toString().padStart(4)} | ${Row.facet}`);
    });

    console.log('\n' + '-'.repeat(60));
    console.log('CÁLCULO DE MÉDIAS');
    console.log('-'.repeat(60));

    let totalSum = 0;
    let totalCount = 0;
    let sumOfFacetAverages = 0;
    let facetCount = 0;

    Object.entries(facetas).forEach(([facet, values]) => {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;

        console.log(`\nFaceta: ${facet}`);
        console.log(`   Valores: ${values.join(', ')}`);
        console.log(`   Soma: ${sum}`);
        console.log(`   Média: ${avg.toFixed(2)}`);

        sumOfFacetAverages += avg;
        facetCount++;

        totalSum += sum;
        totalCount += values.length;
    });

    const mediaGeralQuestoes = totalSum / totalCount;
    const mediaGeralFacetas = sumOfFacetAverages / facetCount;

    console.log('\n' + '='.repeat(60));
    console.log('RESULTADO FINAL');
    console.log('='.repeat(60));
    console.log(`\nMédia Simples das Questões: ${mediaGeralQuestoes.toFixed(2)}`);
    console.log(`Média das Médias das Facetas: ${mediaGeralFacetas.toFixed(2)}`);
    console.log(`\nSistema Result: 66 (provavelmente Média das Facetas arredondada)`);
    console.log(`Planilha Result: 51`);
    console.log(`\nDiferença: ${Math.abs(66 - 51)} pontos`);

    if (Math.abs(mediaGeralQuestoes - 51) < 5) {
        console.log('\n💡 A PLANILHA USA MÉDIA SIMPLES DAS QUESTÕES!');
    } else if (Math.abs(mediaGeralFacetas - 66) < 1) {
        console.log('\n💡 O SISTEMA USA MÉDIA DAS FACETAS (CORRETO PELO CÓDIGO ATUAL)!');
    }

    // Verificar se alguma faceta tem peso diferente ou questão ignorada
    // Se a planilha deu 51, é muito baixo.
    // Questões com valores baixos (25, 50) puxam pra baixo.
    // Questões altas (75, 100) puxam pra cima.

    // Se tivermos erro na inversão, isso explicaria.
    // Vamos checar visualmente se as inversões parecem certas (se tem update recente).

    await prisma.$disconnect();
}

debugDimension().catch(console.error);
