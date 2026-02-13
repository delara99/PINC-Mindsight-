import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateStructure() {
    console.log('='.repeat(80));
    console.log('VALIDAÇÃO: Estrutura TalkingTO vs Banco de Dados');
    console.log('='.repeat(80));

    // Estrutura esperada do TalkingTO
    const TALKINGTO_STRUCTURE = {
        'ABERTURA (CONCRETO-ABSTRATO)': [
            'conservador-aberto',
            'prático-conceitual',
            'realista-imaginativo'
        ],
        'AMABILIDADE (LÓGICO-SENTIMENTAL)': [
            'competitivo-colaborativo',
            'crítico-tolerante',
            'independente-conectado'
        ],
        'ESTABILIDADE EMOCIONAL (EMOÇÃO-RAZÃO)': [
            'inquieto-despreocupado',
            'inseguro-autoconfiante',
            'irritável-tranquilo',
            'reativo-controlado'
        ],
        'ESTRUTURA (ADAPTÁVEL-ESTRUTURADO)': [
            'aventureiro-planejado',
            'espontâneo-disciplinado',
            'flexível-persistente'
        ],
        'EXTROVERSÃO (INTROVERSÃO-EXTROVERSÃO)': [
            'contido-afirmativo',
            'ouvinte-falante',
            'reflexivo-ativo',
            'seletivo-interativo'
        ]
    };

    // Buscar facetas do banco
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isActive: true },
        select: {
            dimension: true,
            facet: true
        },
        distinct: ['dimension', 'facet']
    });

    // Agrupar por dimensão
    const dbStructure: Record<string, Set<string>> = {};
    mappings.forEach(m => {
        if (!dbStructure[m.dimension]) {
            dbStructure[m.dimension] = new Set();
        }
        dbStructure[m.dimension].add(m.facet);
    });

    // Validar cada dimensão
    console.log('\n📊 VALIDAÇÃO POR DIMENSÃO:\n');

    Object.entries(TALKINGTO_STRUCTURE).forEach(([dimension, expectedFacets]) => {
        console.log(`\n🎯 ${dimension}`);
        console.log('-'.repeat(80));

        // Encontrar dimensão correspondente no banco
        const dbDimension = Object.keys(dbStructure).find(d =>
            d.includes('ABERTURA') && dimension.includes('ABERTURA') ||
            d.includes('AMABILIDADE') && dimension.includes('AMABILIDADE') ||
            d.includes('ESTABILIDADE') && dimension.includes('ESTABILIDADE') ||
            d.includes('ESTRUTURA') && dimension.includes('ESTRUTURA') ||
            d.includes('EXTROVERSÃO') && dimension.includes('EXTROVERSÃO')
        );

        if (!dbDimension) {
            console.log('❌ Dimensão não encontrada no banco!');
            return;
        }

        const dbFacets = Array.from(dbStructure[dbDimension]);

        console.log(`   Esperado (${expectedFacets.length} facetas):`);
        expectedFacets.forEach(f => console.log(`   - ${f}`));

        console.log(`\n   No Banco (${dbFacets.length} facetas):`);
        dbFacets.forEach(f => console.log(`   - ${f}`));

        // Verificar se todas as facetas esperadas estão no banco
        const missing = expectedFacets.filter(f => !dbFacets.includes(f));
        const extra = dbFacets.filter(f => !expectedFacets.includes(f));

        if (missing.length === 0 && extra.length === 0) {
            console.log('\n   ✅ PERFEITO! Estrutura idêntica ao TalkingTO');
        } else {
            if (missing.length > 0) {
                console.log('\n   ⚠️  FALTANDO no banco:');
                missing.forEach(f => console.log(`      - ${f}`));
            }
            if (extra.length > 0) {
                console.log('\n   ⚠️  EXTRA no banco (não está no TalkingTO):');
                extra.forEach(f => console.log(`      - ${f}`));
            }
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO FINAL');
    console.log('='.repeat(80));

    const totalExpected = Object.values(TALKINGTO_STRUCTURE).reduce((sum, arr) => sum + arr.length, 0);
    const totalInDb = Object.values(dbStructure).reduce((sum, set) => sum + set.size, 0);

    console.log(`Total de facetas esperadas (TalkingTO): ${totalExpected}`);
    console.log(`Total de facetas no banco: ${totalInDb}`);

    if (totalExpected === totalInDb) {
        console.log('\n✅ ESTRUTURA 100% COMPATÍVEL COM TALKINGTO!\n');
    } else {
        console.log('\n⚠️  ESTRUTURA DIVERGENTE! Revisar diferenças acima.\n');
    }

    await prisma.$disconnect();
}

validateStructure().catch(console.error);
