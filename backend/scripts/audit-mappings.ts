import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditMappings() {
    console.log('='.repeat(80));
    console.log('🕵️‍♂️ AUDITORIA DE DADOS DO MOTOR DE CÁLCULO');
    console.log('='.repeat(80));

    // 1. Verificar Dimensões Únicas
    const dimensions = await prisma.calculationQuestionMapping.groupBy({
        by: ['dimension'],
        _count: { questionId: true }
    });

    console.log('\n📊 DIMENSÕES ENCONTRADAS (Campo de Agrupamento):');
    console.table(dimensions);

    // 2. Verificar Facetas Únicas
    const facets = await prisma.calculationQuestionMapping.groupBy({
        by: ['facet'],
        _count: { questionId: true }
    });

    console.log('\n💎 FACETAS ENCONTRADAS:');
    console.table(facets);

    // 3. Verificar por Placeholders ou Nulos
    const placeholders = await prisma.calculationQuestionMapping.findMany({
        where: {
            OR: [
                { dimension: 'O' }, // Placeholder antigo
                { dimension: 'string' },
                { dimension: '' },
                { facet: '' },
                { questionText: { contains: 'Lore Ipsum' } }
            ]
        }
    });

    if (placeholders.length > 0) {
        // Atenção: A dimensão "O" (Openness) é válida se for a sigla correta, 
        // mas aqui estamos procurando indicativo de erro se todas forem "O".
        // Como vimos antes, temos "CONCRETO-ABSTRATO" etc.
        // Se houver mistura ou apenas "O", avisar.

        console.log('\n⚠️  POSSÍVEIS ARTEFATOS ENCONTRADOS:', placeholders.length);
        // Verificar se "O" é a única dimensão
        if (dimensions.length === 1 && dimensions[0].dimension === 'O') {
            console.log('❌ CRÍTICO: Todas as dimensões são "O". O placeholder ainda existe!');
        } else {
            console.log('ℹ️  Nota: "O" pode ser uma dimensão válida (Openness) se misturada com outras.');
        }
    } else {
        console.log('\n✅ NENHUM PLACEHOLDER ÓBVIO DETECTADO.');
    }

    // 4. Verificar quantidade total
    const total = await prisma.calculationQuestionMapping.count();
    console.log(`\n📦 TOTAL DE QUESTÕES MAPEADAS: ${total} (Esperado: 126)`);

    await prisma.$disconnect();
}

auditMappings().catch(console.error);
