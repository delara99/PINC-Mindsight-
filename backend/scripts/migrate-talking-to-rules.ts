
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Facet Mapping Definitions (Order matters!)
const FACET_MAP: Record<string, string[][]> = {
    'EXTRAVERSION': [
        ['OUVINTE', 'FALANTE'],
        ['SELETIVO', 'INTERATIVO'],
        ['CONTIDO', 'AFIRMATIVO'],
        ['REFLEXIVO', 'ATIVO']
    ],
    'AGREEABLENESS': [
        ['CRITICO', 'TOLERANTE'],
        ['INDEPENDENTE', 'CONECTADO'],
        ['COMPETITIVO', 'COLABORATIVO']
    ],
    'CONSCIENTIOUSNESS': [
        ['AVENTUREIRO', 'PLANEJADO'],
        ['ESPONTANEO', 'DISCIPLINADO'],
        ['FLEXIVEL', 'PERSISTENTE']
    ],
    'OPENNESS': [
        ['REALISTA', 'IMAGINATIVO'],
        ['PRATICO', 'CONCEITUAL'],
        ['CONSERVADOR', 'ABERTO']
    ],
    'NEUROTICISM': [
        ['DESPREOCUPADO', 'INQUIETO'],
        ['AUTOCONFIANTE', 'INSEGURO'],
        ['TRANQUILO', 'IRRITAVEL'],
        ['CONTROLADO', 'REATIVO']
    ]
};

// Existing Signatures (Simplified subset for demo, in prod we would scrape the file or dynamic load)
// Since we can't easily import the private FINETUNED_TEXTS from the service,
// we will query the `TalkingToMessage` table for keys starting with 'FINE_TUNED' or 'EXTRAVERSION_' etc.
// But signatures are embedded in the service logic. 
// BETTER APPROCH: Iterate over the expected combinations based on the database keys.

async function main() {
    console.log('🚀 Iniciando migração de Regras TalkingTO...');

    // 1. Fetch all Fine-Tuned Messages
    const messages = await prisma.talkingToMessage.findMany({
        where: { group: 'FINE_TUNED' }
    });

    console.log(`📋 Encontradas ${messages.length} mensagens de Interpretação Fina.`);

    let createdCount = 0;

    for (const msg of messages) {
        // Key format: TRAIT_SIGNATURE (e.g., EXTRAVERSION_OUVINTE_SELETIVO_CONTIDO_REFLEXIVO)
        const parts = msg.key.split('_');
        const trait = parts[0];

        // Validation: Is it a valid trait?
        if (!FACET_MAP[trait]) {
            console.warn(`⚠️  Mensagem ignorada (Traço desconhecido): ${msg.key}`);
            continue;
        }

        // Parse Signature
        // The signature starts after the trait.
        // EXTRAVERSION is index 0. So parts[1...] are the signature components.
        const signatureParts = parts.slice(1);

        // Build JSON Conditions
        const conditions: any = {
            trait: trait, // Main Trait
            facets: {}
        };

        let isValidSignature = true;

        // Map each label in the signature to a condition
        // We need to look up which index this label belongs to.
        // Naive approach: Search the map.

        for (const label of signatureParts) {
            let found = false;
            // Find which facet index this label belongs to
            FACET_MAP[trait].forEach((pair, idx) => {
                if (pair[0] === label) {
                    // Low Score (< 50)
                    conditions.facets[`facet_${idx}`] = { max: 49, label: label };
                    found = true;
                } else if (pair[1] === label) {
                    // High Score (>= 50)
                    conditions.facets[`facet_${idx}`] = { min: 50, label: label };
                    found = true;
                }
            });

            if (!found) {
                // Could be a compound label or typo. 
                // Some labels in DB might have underscores? 
                // The DB key uses underscores as separators.
                // e.g. OUVINTE_SELETIVO
                // This is tricky. simpler way:
                // We know the ORDER of facets.
                // BUT the signature in key string is flattened.
                // "OUVINTE_SELETIVO_CONTIDO_REFLEXIVO" -> 4 parts.
                // Matches 4 facets of Extraversion. Perfect.
            }
        }

        // Just blindly applying index based on order if the lengths match
        if (signatureParts.length === FACET_MAP[trait].length) {
            signatureParts.forEach((label, idx) => {
                const pair = FACET_MAP[trait][idx];
                if (label === pair[0]) {
                    conditions.facets[idx] = { max: 49, label: label }; // Low
                } else if (label === pair[1]) {
                    conditions.facets[idx] = { min: 50, label: label }; // High
                }
            });
        } else {
            console.warn(`⚠️  Assinatura com tamanho incorreto para ${trait}: ${msg.key}`);
            // Attempt fuzzy match? No, stricter is better.
            continue;
        }

        // Create the Rule
        const ruleName = `Regra Auto: ${trait} - ${signatureParts.join(', ')}`;

        // Check if exists to avoid dupes
        const existing = await prisma.talkingToRule.findFirst({
            where: { messageId: msg.id }
        });

        if (!existing) {
            await prisma.talkingToRule.create({
                data: {
                    name: ruleName.replace(/_/g, ' '),
                    description: `Migração automática baseada na chave ${msg.key}`,
                    domain: `OCEAN_${trait[0]}`, // E, A, C ...
                    priority: 10, // Fine-tuned has higher priority
                    conditions: conditions,
                    messageId: msg.id,
                    isActive: true
                }
            });
            createdCount++;
        }
    }

    console.log(`✅ Migração concluída. ${createdCount} regras criadas.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
