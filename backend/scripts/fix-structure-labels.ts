import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Corrigindo Labels da Estrutura (Facetas)...');

    // 1. Extroversão: 'sociável' -> 'interativo'
    // Tentar encontrar pela chave interna se existir, ou pelo valor antigo
    // No seed anterior: key='SOCIAL_INTERACTION'

    // Buscar faceta Sociável
    const facetSocial = await prisma.talkingToFacet.findFirst({
        where: { key: 'SOCIAL_INTERACTION' }
    });

    if (facetSocial) {
        if (facetSocial.facetHigh === 'sociável') {
            await prisma.talkingToFacet.update({
                where: { id: facetSocial.id },
                data: { facetHigh: 'interativo' }
            });
            console.log('✅ Corrigido: SOCIAL_INTERACTION -> interativo');
        } else {
            console.log('ℹ️ SOCIAL_INTERACTION já está correto ou diferente:', facetSocial.facetHigh);
        }
    }

    // 2. Estabilidade: 'paciente' -> 'tranquilo'
    // No seed: key='TEMPERAMENT' (De irritável-paciente)
    const facetTemperament = await prisma.talkingToFacet.findFirst({
        where: { key: 'TEMPERAMENT' }
    });

    if (facetTemperament) {
        if (facetTemperament.facetHigh === 'paciente') {
            await prisma.talkingToFacet.update({
                where: { id: facetTemperament.id },
                data: { facetHigh: 'tranquilo' }
            });
            console.log('✅ Corrigido: TEMPERAMENT -> tranquilo');
        } else {
            console.log('ℹ️ TEMPERAMENT já está correto ou diferente:', facetTemperament.facetHigh);
        }
    }

    // 3. Estabilidade: 'confiança' -> 'confiança' (Wait, seed says 'inquieto-despreocupado', key 'CONFIDENCE')
    // Na chave de msg: DESPREOCUPADO. (Ok)

    // Verificando chaves de Neuroticismo (Estabilidade)
    // Confiança (inquieto/despreocupado) -> Key 'CONFIDENCE'
    // Autoconfiança (inseguro/autoconfiante) -> Key 'SELF_CONFIDENCE'
    // Temperamento (irritável/tranquilo) -> Key 'TEMPERAMENT'
    // Controle (reativo/controlado) -> Key 'CONTROL'

    // Ordem no seed messages:
    // DESPREOCUPADO_AUTOCONFIANTE_TRANQUILO_CONTROLADO
    // 1. CONFIDENCE (Despreocupado)
    // 2. SELF_CONFIDENCE (Autoconfiante)
    // 3. TEMPERAMENT (Tranquilo)
    // 4. CONTROL (Controlado)

    // Se o createdAt garantir essa ordem, ok.

    // Verifica se existem as facetas
    const facetsN = await prisma.talkingToFacet.findMany({
        where: { dimension: { key: 'N' } },
        orderBy: { createdAt: 'asc' }
    });

    console.log('🔍 Ordem Facetas Estabilidade (Check):');
    facetsN.forEach(f => console.log(` - ${f.key}: ${f.facetLow}/${f.facetHigh}`));

    console.log('🎉 Correções concluídas.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
