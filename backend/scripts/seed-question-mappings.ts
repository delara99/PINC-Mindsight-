import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * SEED DE MAPEAMENTO DE QUESTÕES
 * 
 * Popula a tabela calculation_question_mappings com o mapeamento completo
 * de todas as 126 questões do inventário TalkingTO para suas respectivas
 * dimensões e facetas.
 */

async function main() {
    console.log('🔧 Iniciando seed de mapeamento de questões...\n');

    // Ler dados das questões
    const questionsData = JSON.parse(fs.readFileSync('/tmp/questions-mapping.json', 'utf-8'));

    console.log(`📊 Total de questões a mapear: ${questionsData.length}\n`);

    // Mapeamento de dimensões
    const dimensionMap: Record<string, string> = {
        'OPENNESS': 'O',
        'CONSCIENTIOUSNESS': 'C',
        'EXTRAVERSION': 'E',
        'AGREEABLENESS': 'A',
        'NEUROTICISM': 'N'
    };

    const dimensionNames: Record<string, string> = {
        'O': 'Abertura à Experiência',
        'C': 'Conscienciosidade',
        'E': 'Extroversão',
        'A': 'Amabilidade',
        'N': 'Neuroticismo'
    };

    let count = 0;
    let questionNumber = 1;

    for (const question of questionsData) {
        const dimension = dimensionMap[question.traitKey] || question.traitKey;
        const facet = question.facetKey || question.subtrait || question.concept;

        try {
            await prisma.calculationQuestionMapping.upsert({
                where: {
                    questionId_dimension: {
                        questionId: questionNumber,
                        dimension: dimension
                    }
                },
                update: {
                    questionText: `Questão ${questionNumber} - ${dimensionNames[dimension] || dimension}`,
                    facet: facet,
                    weight: 1.0,
                    isReversed: question.isReverse === 1,
                    description: `Faceta: ${facet || 'N/A'} | Reversa: ${question.isReverse === 1 ? 'Sim' : 'Não'}`
                },
                create: {
                    questionId: questionNumber,
                    questionText: `Questão ${questionNumber} - ${dimensionNames[dimension] || dimension}`,
                    dimension: dimension,
                    facet: facet,
                    weight: 1.0,
                    isReversed: question.isReverse === 1,
                    description: `Faceta: ${facet || 'N/A'} | Reversa: ${question.isReverse === 1 ? 'Sim' : 'Não'}`
                }
            });

            count++;
            if (count % 10 === 0) {
                console.log(`✅ ${count}/${questionsData.length} questões mapeadas...`);
            }
        } catch (error) {
            console.error(`❌ Erro ao mapear questão ${questionNumber}:`, error);
        }

        questionNumber++;
    }

    console.log(`\n🎉 Sucesso! ${count} questões mapeadas.`);

    // Estatísticas
    console.log('\n📊 Estatísticas por Dimensão:');
    const stats = await prisma.calculationQuestionMapping.groupBy({
        by: ['dimension'],
        _count: true,
        where: { isActive: true }
    });

    stats.forEach(stat => {
        console.log(`   ${stat.dimension} (${dimensionNames[stat.dimension] || stat.dimension}): ${stat._count} questões`);
    });

    // Questões reversas
    const reversedCount = await prisma.calculationQuestionMapping.count({
        where: { isReversed: true, isActive: true }
    });
    console.log(`\n🔄 Questões reversas: ${reversedCount}`);

    console.log('\n✨ Mapeamento completo! Agora o Motor de Cálculo está totalmente configurado.');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
