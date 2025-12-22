import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando população de textos interpretativos...\n');

    // 1. Buscar todas as configs ativas
    const configs = await prisma.bigFiveConfig.findMany({
        where: { isActive: true }
    });

    console.log(`📊 Encontradas ${configs.length} configurações ativas\n`);

    if (configs.length === 0) {
        console.error('❌ Nenhuma configuração Big Five encontrada!');
        console.log('👉 Execute primeiro: npm run seed');
        process.exit(1);
    }

    const traits = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
    const ranges = ['VERY_LOW', 'LOW', 'AVERAGE', 'HIGH', 'VERY_HIGH'];
    const categories = ['SUMMARY', 'PRACTICAL_IMPACT', 'EXPERT_SYNTHESIS', 'EXPERT_HYPOTHESIS'];

    let created = 0;
    let skipped = 0;

    for (const config of configs) {
        console.log(`\n⚙️  Processando: ${config.name} (${config.id})`);

        for (const trait of traits) {
            for (const range of ranges) {
                for (const category of categories) {
                    // Verificar se já existe
                    const existing = await prisma.bigFiveInterpretativeText.findFirst({
                        where: {
                            configId: config.id,
                            traitKey: trait,
                            scoreRange: range,
                            category: category
                        }
                    });

                    if (existing) {
                        skipped++;
                    } else {
                        await prisma.bigFiveInterpretativeText.create({
                            data: {
                                configId: config.id,
                                traitKey: trait,
                                scoreRange: range,
                                category: category,
                                context: category === 'PRACTICAL_IMPACT' ? 'TRABALHO' : null,
                                text: `Texto ${category} para ${trait} em nível ${range} (Config: ${config.name})`
                            }
                        });
                        created++;
                    }
                }
            }
        }

        console.log(`   ✅ Config processada`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ CONCLUÍDO!`);
    console.log(`   📝 Criados: ${created} textos`);
    console.log(`   ⏭️  Ignorados: ${skipped} (já existiam)`);
    console.log(`   📊 Total: ${created + skipped}`);
    console.log('='.repeat(50) + '\n');
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
