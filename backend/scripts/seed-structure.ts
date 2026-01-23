
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATA = [
    {
        key: 'E',
        name: 'EXTROVERSÃO',
        dichotomy: 'Introversão-Extroversão',
        low: 'INTROVERTIDO',
        high: 'EXTROVERTIDO',
        color: '#F59E0B',
        facets: [
            { dichotomy: 'ouvinte-falante', low: 'ouvinte', high: 'falante', concept: 'comunicação', key: 'COMMUNICATION' },
            { dichotomy: 'seletivo-sociável', low: 'seletivo', high: 'sociável', concept: 'interação social', key: 'SOCIAL_INTERACTION' },
            { dichotomy: 'contido-afirmativo', low: 'contido', high: 'afirmativo', concept: 'autoridade', key: 'AUTHORITY' },
            { dichotomy: 'reflexivo-ativo', low: 'reflexivo', high: 'ativo', concept: 'orientação para ação', key: 'ACTION_ORIENTATION' }
        ]
    },
    {
        key: 'A',
        name: 'AMABILIDADE',
        dichotomy: 'Lógico-Sentimental',
        low: 'LÓGICO',
        high: 'SENTIMENTAL',
        color: '#10B981',
        facets: [
            { dichotomy: 'crítico-tolerante', low: 'crítico', high: 'tolerante', concept: 'lógica', key: 'LOGIC' },
            { dichotomy: 'independente-conectado', low: 'independente', high: 'conectado', concept: 'independência pessoal', key: 'INDEPENDENCE' },
            { dichotomy: 'competitivo-colaborativo', low: 'competitivo', high: 'colaborativo', concept: 'competitividade', key: 'COMPETITIVENESS' }
        ]
    },
    {
        key: 'C',
        name: 'ESTRUTURA',
        dichotomy: 'Adaptável-Estrutura',
        low: 'ADAPTÁVEL',
        high: 'ESTRUTURADO',
        color: '#3B82F6',
        facets: [
            { dichotomy: 'aventureiro-planejado', low: 'aventureiro', high: 'planejado', concept: 'estilo de planejamento', key: 'PLANNING' },
            { dichotomy: 'espontâneo-disciplinado', low: 'espontâneo', high: 'disciplinado', concept: 'disciplina', key: 'DISCIPLINE' },
            { dichotomy: 'flexível-persistente', low: 'flexível', high: 'persistente', concept: 'persistência', key: 'PERSISTENCE' }
        ]
    },
    {
        key: 'O',
        name: 'ABERTURA',
        dichotomy: 'Concreto-Abstrato',
        low: 'CONCRETO',
        high: 'ABSTRATO',
        color: '#8B5CF6',
        facets: [
            { dichotomy: 'realista-imaginativo', low: 'realista', high: 'imaginativo', concept: 'imaginação', key: 'IMAGINATION' },
            { dichotomy: 'prático-conceitual', low: 'prático', high: 'conceitual', concept: 'intelectualidade', key: 'INTELLECT' },
            { dichotomy: 'conservador-aberto', low: 'conservador', high: 'aberto', concept: 'abertura ao novo', key: 'OPENNESS_TO_NEW' }
        ]
    },
    {
        key: 'N', // Or Stability? Let's keep N for internal consistency with Big 5 but naming it Estabilidade
        name: 'ESTABILIDADE EMOCIONAL',
        dichotomy: 'Emoção-Razão',
        low: 'EMOCIONAL', // Low Stability = High Neuroticism (Emotion)
        high: 'RACIONAL', // High Stability = Low Neuroticism (Reason)
        color: '#EF4444',
        facets: [
            { dichotomy: 'inquieto-despreocupado', low: 'inquieto', high: 'despreocupado', concept: 'confiança', key: 'CONFIDENCE' }, // Changed concept to Confiança based on some interpretation, user said "confiança" on row 14?
            { dichotomy: 'inseguro-autoconfiante', low: 'inseguro', high: 'autoconfiante', concept: 'autoconfiança', key: 'SELF_CONFIDENCE' },
            { dichotomy: 'irritável-paciente', low: 'irritável', high: 'paciente', concept: 'temperamento', key: 'TEMPERAMENT' },
            { dichotomy: 'reativo-controlado', low: 'reativo', high: 'controlado', concept: 'controlado', key: 'CONTROL' }
        ]
    }
];

async function main() {
    console.log('🌱 Seeding Psychometric Structure...');

    for (const dim of DATA) {
        console.log(`Processing ${dim.name}...`);

        // Upsert Dimension
        const dimension = await prisma.talkingToDimension.upsert({
            where: { key: dim.key },
            update: {
                name: dim.name,
                dichotomy: dim.dichotomy,
                questionTraitLow: dim.low,
                questionTraitHigh: dim.high,
                color: dim.color
            },
            create: {
                key: dim.key,
                name: dim.name,
                dichotomy: dim.dichotomy,
                questionTraitLow: dim.low,
                questionTraitHigh: dim.high,
                color: dim.color
            }
        });

        // Upsert Facets
        for (const facet of dim.facets) {
            // Need a unique key for upsert, but we don't have one in schema yet for facet except ID.
            // We'll delete existing facets for this dimension and recreate to ensure sync, 
            // OR check if one exists with the same key/dichotomy.

            // Allow update by key if we had one. Schema says key is optional/nullable?
            // Let's simple delete all and recreate for this seed execution to be clean.
            // But that might break IDs if linked.
            // Let's try to find by dichotomy + dimensionId.

            const existing = await prisma.talkingToFacet.findFirst({
                where: { dimensionId: dimension.id, dichotomy: facet.dichotomy }
            });

            if (existing) {
                await prisma.talkingToFacet.update({
                    where: { id: existing.id },
                    data: {
                        facetLow: facet.low,
                        facetHigh: facet.high,
                        concept: facet.concept,
                        key: facet.key, // Store internal key
                    }
                });
            } else {
                await prisma.talkingToFacet.create({
                    data: {
                        dimensionId: dimension.id,
                        dichotomy: facet.dichotomy,
                        facetLow: facet.low,
                        facetHigh: facet.high,
                        concept: facet.concept,
                        key: facet.key,
                        name: facet.dichotomy // Default name
                    }
                });
            }
        }
    }

    console.log('✅ Structure Seeded Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
