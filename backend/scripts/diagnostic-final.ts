import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticFinal() {
    const assignmentId = '7e13511d-02fc-4374-8e5e-d9f4f003fc5c';

    console.log('='.repeat(80));
    console.log('DIAGNÓSTICO COMPLETO - DIVERGÊNCIA DE SCORES');
    console.log('='.repeat(80));

    // 1. Buscar Assignment com resultado salvo
    const assignment = await prisma.assessmentAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            result: true,
            user: { select: { id: true, name: true, email: true, tenantId: true } }
        }
    });

    if (!assignment) {
        console.log('❌ Assignment não encontrado');
        return;
    }

    console.log('\n📋 INFORMAÇÕES DO ASSIGNMENT:');
    console.log(`ID: ${assignment.id}`);
    console.log(`User: ${assignment.user.name} (${assignment.user.email})`);
    console.log(`TenantId: ${assignment.user.tenantId}`);
    console.log(`Status: ${assignment.status}`);

    // 2. Verificar resultado SALVO no banco
    console.log('\n📊 RESULTADO SALVO NO BANCO (AssessmentResult):');
    if (assignment.result?.scores) {
        console.log('✅ Existe resultado salvo');
        console.log('\nJSON COMPLETO:');
        console.log(JSON.stringify(assignment.result.scores, null, 2));

        const savedScores = assignment.result.scores as any;
        if (Array.isArray(savedScores)) {
            console.log('\nSCORES FORMATADOS:');
            savedScores.forEach((trait: any) => {
                console.log(`\n${trait.traitName || trait.traitKey}: ${trait.normalizedScore || trait.score}`);
                if (trait.facets && Array.isArray(trait.facets)) {
                    trait.facets.forEach((f: any) => {
                        console.log(`  └─ ${f.facetName || f.facetKey}: ${f.score || f.rawScore || f.normalizedScore}`);
                    });
                }
            });
        }
    } else {
        console.log('❌ NÃO existe resultado salvo');
    }

    // 3. Buscar respostas do usuário
    const responses = await prisma.assessmentResponse.findMany({
        where: { assignmentId: assignment.id }
    });

    console.log(`\n📝 Total de respostas: ${responses.length}`);

    // 4. Verificar mapeamentos ativos
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isActive: true }
    });

    console.log(`\n🗺️  Total de mapeamentos ativos: ${mappings.length}`);

    // Agrupar por dimensão
    const byDimension: Record<string, number> = {};
    mappings.forEach(m => {
        byDimension[m.dimension] = (byDimension[m.dimension] || 0) + 1;
    });

    console.log('\nDistribuição por dimensão:');
    Object.entries(byDimension).forEach(([dim, count]) => {
        console.log(`  - ${dim}: ${count} questões`);
    });

    // 5. Simular cálculo baseado nas respostas
    console.log('\n🧮 SIMULAÇÃO DE CÁLCULO (usando respostas + mapeamentos):');

    const responsesByQuestionId: Record<string, number> = {};
    responses.forEach(r => {
        responsesByQuestionId[r.questionId] = r.answer;
    });

    const dimensionScores: Record<string, { sum: number; count: number; facets: Record<string, { sum: number; count: number }> }> = {};

    mappings.forEach(mapping => {
        const responseValue = responsesByQuestionId[mapping.questionId];

        if (responseValue !== undefined && responseValue !== null) {
            let score = responseValue;
            if (mapping.isReversed) {
                score = 6 - score;
            }

            if (!dimensionScores[mapping.dimension]) {
                dimensionScores[mapping.dimension] = { sum: 0, count: 0, facets: {} };
            }

            dimensionScores[mapping.dimension].sum += score;
            dimensionScores[mapping.dimension].count += 1;

            if (mapping.facet) {
                if (!dimensionScores[mapping.dimension].facets[mapping.facet]) {
                    dimensionScores[mapping.dimension].facets[mapping.facet] = { sum: 0, count: 0 };
                }
                dimensionScores[mapping.dimension].facets[mapping.facet].sum += score;
                dimensionScores[mapping.dimension].facets[mapping.facet].count += 1;
            }
        }
    });

    Object.entries(dimensionScores).forEach(([dimension, data]) => {
        const avgScore = data.count > 0 ? (data.sum / data.count) : 0;
        const normalizedScore = Math.round(((avgScore - 1) / 4) * 100);

        console.log(`\n${dimension}: ${normalizedScore}`);
        console.log(`  (Média bruta: ${avgScore.toFixed(2)}, Respostas: ${data.count})`);

        Object.entries(data.facets).forEach(([facet, facetData]) => {
            const facetAvg = facetData.count > 0 ? (facetData.sum / facetData.count) : 0;
            const facetNormalized = Math.round(((facetAvg - 1) / 4) * 100);
            console.log(`  └─ ${facet}: ${facetNormalized} (${facetData.count} respostas)`);
        });
    });

    console.log('\n' + '='.repeat(80));
    console.log('CONCLUSÃO:');
    console.log('='.repeat(80));
    console.log('Compare os 3 valores:');
    console.log('1. SALVO NO BANCO (acima) - O que deveria ser a "verdade oficial"');
    console.log('2. SIMULAÇÃO (acima) - O que o motor calcula AGORA com os dados atuais');
    console.log('3. O que o ESPECIALISTA mostra na tela');
    console.log('4. O que o CLIENTE mostra na tela');
    console.log('\nSe houver divergência, identifique qual fonte cada relatório está usando.');
    console.log('='.repeat(80));

    await prisma.$disconnect();
}

diagnosticFinal().catch(console.error);
