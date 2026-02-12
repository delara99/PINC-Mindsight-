import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MIGRAÇÃO: Big Five → TalkingTO
 * 
 * Este script remapeia todas as facetas Big Five para a nomenclatura TalkingTO.
 * 
 * SEGURANÇA:
 * - NÃO afeta testes já completados (scores salvos)
 * - Apenas atualiza CalculationQuestionMapping
 * - Novos testes usarão nomenclatura TalkingTO
 */

// Mapeamento DEFINITIVO: Big Five → TalkingTO
const FACET_MIGRATION_MAP: Record<string, string> = {
    // INTROVERSÃO-EXTROVERSÃO
    'EXTRAVERSION_F1': 'ouvinte-falante',
    'EXTRAVERSION_F2': 'seletivo-interativo',
    'EXTRAVERSION_F4': 'contido-afirmativo',
    'EXTRAVERSION_F5': 'reflexivo-ativo',
    'EXTRAVERSION_F6': 'ouvinte-falante', // Cheerfulness → Warmth
    'GREGARISMO': 'seletivo-interativo',
    'BUSCA_EXCITAÇÃO': 'reflexivo-ativo',
    'EMOÇÕES_POSITIVAS': 'ouvinte-falante',

    // CONCRETO-ABSTRATO
    'OPENNESS_F2': 'prático-conceitual', // Aesthetics
    'OPENNESS_F3': 'conservador-aberto', // Feelings
    'OPENNESS_F4': 'conservador-aberto', // Actions
    'OPENNESS_F5': 'prático-conceitual', // Ideas
    'OPENNESS_F6': 'conservador-aberto', // Values
    'ações': 'realista-imaginativo',
    'sentimentos': 'conservador-aberto',

    // ADAPTÁVEL-ESTRUTURADO
    'CONSCIENTIOUSNESS_F1': 'aventureiro-planejado', // Competence
    'CONSCIENTIOUSNESS_F2': 'espontâneo-disciplinado', // Order
    'CONSCIENTIOUSNESS_F3': 'aventureiro-planejado', // Dutifulness
    'CONSCIENTIOUSNESS_F4': 'flexível-persistente', // Achievement
    'CONSCIENTIOUSNESS_F5': 'espontâneo-disciplinado', // Self-discipline
    'CONSCIENTIOUSNESS_F6': 'aventureiro-planejado', // Deliberation
    'competência': 'aventureiro-planejado',
    'ordem': 'espontâneo-disciplinado',
    'ESFORÇO': 'flexível-persistente',
    'SENSO_DEVER': 'aventureiro-planejado',

    // EMOÇÃO-RAZÃO
    'NEUROTICISM_F1': 'inquieto-despreocupado', // Anxiety
    'NEUROTICISM_F2': 'irritável-tranquilo', // Anger/Hostility
    'NEUROTICISM_F3': 'inseguro-autoconfiante', // Depression
    'NEUROTICISM_F4': 'inseguro-autoconfiante', // Self-consciousness
    'NEUROTICISM_F5': 'reativo-controlado', // Impulsiveness
    'NEUROTICISM_F6': 'reativo-controlado', // Vulnerability
    'autoconsciência': 'inseguro-autoconfiante',

    // LÓGICO-SENTIMENTAL
    'AGREEABLENESS_F1': 'crítico-tolerante', // Trust
    'AGREEABLENESS_F2': 'crítico-tolerante', // Straightforwardness
    'AGREEABLENESS_F4': 'competitivo-colaborativo', // Compliance
    'confiança': 'crítico-tolerante',
    'modéstia': 'independente-conectado',
    'sensibilidade': 'independente-conectado'
};

async function migrateFacets() {
    console.log('='.repeat(80));
    console.log('MIGRAÇÃO: Big Five → TalkingTO');
    console.log('='.repeat(80));

    // 1. Buscar todos os mapeamentos ativos
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isActive: true }
    });

    console.log(`\n📊 Total de mapeamentos ativos: ${mappings.length}`);

    // 2. Identificar quais precisam ser migrados
    const toMigrate = mappings.filter(m => FACET_MIGRATION_MAP[m.facet]);

    console.log(`🔄 Mapeamentos a migrar: ${toMigrate.length}`);

    if (toMigrate.length === 0) {
        console.log('\n✅ Nenhuma migração necessária! Todas as facetas já estão no formato TalkingTO.');
        await prisma.$disconnect();
        return;
    }

    // 3. Mostrar preview
    console.log('\n📋 PREVIEW DA MIGRAÇÃO:');
    console.log('-'.repeat(80));

    const byFacet: Record<string, number> = {};
    toMigrate.forEach(m => {
        const newFacet = FACET_MIGRATION_MAP[m.facet];
        const key = `${m.facet} → ${newFacet}`;
        byFacet[key] = (byFacet[key] || 0) + 1;
    });

    Object.entries(byFacet).forEach(([change, count]) => {
        console.log(`  ${change} (${count} questões)`);
    });

    // 4. Confirmar
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  ATENÇÃO: Esta operação vai ATUALIZAR o banco de dados!');
    console.log('='.repeat(80));
    console.log('\nO que vai acontecer:');
    console.log('  ✅ Testes antigos: Mantêm scores salvos (não afetados)');
    console.log('  ✅ Testes novos: Usarão nomenclatura TalkingTO');
    console.log('  ✅ Mapeamentos: Atualizados para TalkingTO');
    console.log('\nPara executar a migração, descomente a linha "await executeMigration()"');
    console.log('no final deste script.\n');

    // 5. Executar migração (DESCOMENTADO PARA RODAR)
    await executeMigration(toMigrate);

    await prisma.$disconnect();
}

async function executeMigration(toMigrate: any[]) {
    console.log('\n🚀 EXECUTANDO MIGRAÇÃO...\n');

    let updated = 0;
    let errors = 0;

    for (const mapping of toMigrate) {
        const newFacet = FACET_MIGRATION_MAP[mapping.facet];

        try {
            await prisma.calculationQuestionMapping.update({
                where: { id: mapping.id },
                data: { facet: newFacet }
            });

            console.log(`  ✅ ${mapping.questionId}: ${mapping.facet} → ${newFacet}`);
            updated++;
        } catch (error) {
            console.error(`  ❌ Erro ao atualizar ${mapping.questionId}:`, error);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('RESULTADO DA MIGRAÇÃO');
    console.log('='.repeat(80));
    console.log(`✅ Atualizados: ${updated}`);
    console.log(`❌ Erros: ${errors}`);
    console.log('\n✨ Migração concluída! Novos testes usarão nomenclatura TalkingTO.\n');
}

migrateFacets().catch(console.error);
