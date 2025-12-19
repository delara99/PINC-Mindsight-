import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 DIAGNÓSTICO DE FACETAS\n');

    // 1. Verificar configuração ativa
    console.log('1️⃣ CONFIGURAÇÃO BIG FIVE ATIVA:');
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: { isActive: true },
        include: {
            traits: {
                include: { facets: true }
            }
        }
    });

    if (activeConfig) {
        console.log(`✅ Config: "${activeConfig.name}" (ID: ${activeConfig.id})`);
        console.log(`   Traços: ${activeConfig.traits.length}`);

        for (const trait of activeConfig.traits) {
            const facetCount = trait.facets?.length || 0;
            const status = facetCount > 0 ? '✅' : '❌';
            console.log(`   ${status} ${trait.name}: ${facetCount} facetas`);
        }
    } else {
        console.log('❌ Nenhuma configuração ativa encontrada');
    }

    // 2. Verificar template Big Five
    console.log('\n2️⃣ TEMPLATE BIG FIVE (Inventário mais antigo):');
    const template = await prisma.assessmentModel.findFirst({
        where: { type: 'BIG_FIVE' },
        include: { questions: true },
        orderBy: { createdAt: 'asc' }
    });

    if (template) {
        console.log(`✅ Template: "${template.title}" (ID: ${template.id})`);
        console.log(`   Total de questões: ${template.questions.length}`);

        // Verificar traitKeys das questões
        const traitKeys = new Set(template.questions.map(q => q.traitKey));
        console.log(`   Traços únicos nas questões:`);
        traitKeys.forEach(key => {
            const count = template.questions.filter(q => q.traitKey === key).length;
            console.log(`   - ${key}: ${count} questões`);
        });
    } else {
        console.log('❌ Template não encontrado');
    }

    // 3. Verificar último inventário clonado
    console.log('\n3️⃣ ÚLTIMO INVENTÁRIO CRIADO:');
    const lastCloned = await prisma.assessmentModel.findFirst({
        where: { type: 'BIG_FIVE' },
        include: { questions: true },
        orderBy: { createdAt: 'desc' }
    });

    if (lastCloned) {
        console.log(`✅ Inventário: "${lastCloned.title}" (ID: ${lastCloned.id})`);
        console.log(`   Criado em: ${lastCloned.createdAt}`);
        console.log(`   Total de questões: ${lastCloned.questions.length}`);

        const traitKeys = new Set(lastCloned.questions.map(q => q.traitKey));
        console.log(`   Traços únicos nas questões:`);
        traitKeys.forEach(key => {
            const count = lastCloned.questions.filter(q => q.traitKey === key).length;
            console.log(`   - ${key}: ${count} questões`);
        });
    }

    console.log('\n📋 RESUMO:');
    if (activeConfig) {
        const traitsWithFacets = activeConfig.traits.filter(t => t.facets && t.facets.length > 0).length;
        const traitsWithoutFacets = activeConfig.traits.length - traitsWithFacets;

        if (traitsWithoutFacets > 0) {
            console.log(`⚠️  ${traitsWithoutFacets} traço(s) SEM facetas na config ativa`);
            console.log(`💡 SOLUÇÃO: Use o botão "Corrigir TODAS (Definitivo)" na página de edição`);
        } else {
            console.log(`✅ Todos os traços têm facetas!`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
