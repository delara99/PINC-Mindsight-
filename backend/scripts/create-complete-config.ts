import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 CRIANDO CONFIGURAÇÃO BIG FIVE COMPLETA DO ZERO\n');

    // 1. Buscar o tenant do admin
    const admin = await prisma.user.findFirst({
        where: { role: 'TENANT_ADMIN' }
    });

    if (!admin) {
        console.log('❌ Nenhum admin encontrado');
        return;
    }

    console.log(`✅ Admin: ${admin.email} (Tenant: ${admin.tenantId})\n`);

    // 2. Desativar todas as configs existentes
    await prisma.bigFiveConfig.updateMany({
        where: { tenantId: admin.tenantId },
        data: { isActive: false }
    });

    // 3. Criar nova configuração
    const config = await prisma.bigFiveConfig.create({
        data: {
            tenantId: admin.tenantId,
            name: 'Configuração Big Five - Completa',
            isActive: true,
            veryLowMax: 20,
            lowMax: 40,
            averageMax: 60,
            highMax: 80,
            primaryColor: '#8B5CF6'
        }
    });

    console.log(`✅ Configuração criada: ${config.id}\n`);

    // 4. Definir traços e facetas padrão
    const traitsData = [
        {
            key: 'OPENNESS',
            name: 'Abertura à Experiência',
            facets: ['Fantasia', 'Estética', 'Sentimentos', 'Ações', 'Ideias', 'Valores']
        },
        {
            key: 'CONSCIENTIOUSNESS',
            name: 'Conscienciosidade',
            facets: ['Competência', 'Ordem', 'Senso de dever', 'Esforço por realizações', 'Autodisciplina', 'Ponderação']
        },
        {
            key: 'EXTRAVERSION',
            name: 'Extroversão',
            facets: ['Cordialidade', 'Gregariedade', 'Assertividade', 'Atividade', 'Busca de sensações', 'Emoções positivas']
        },
        {
            key: 'AGREEABLENESS',
            name: 'Amabilidade',
            facets: ['Confiança', 'Franqueza', 'Altruísmo', 'Complacência', 'Modéstia', 'Sensibilidade']
        },
        {
            key: 'NEUROTICISM',
            name: 'Neuroticismo',
            facets: ['Ansiedade', 'Hostilidade', 'Depressão', 'Embaraço', 'Impulsividade', 'Vulnerabilidade']
        }
    ];

    // 5. Criar traços e facetas
    for (let i = 0; i < traitsData.length; i++) {
        const traitData = traitsData[i];

        const trait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: config.id,
                traitKey: traitData.key,
                name: traitData.name,
                weight: 1.0,
                isActive: true,
                description: `Avalia o nível de ${traitData.name.toLowerCase()}`,
                veryLowText: 'Muito Baixo',
                lowText: 'Baixo',
                averageText: 'Médio',
                highText: 'Alto',
                veryHighText: 'Muito Alto'
            }
        });

        console.log(`✅ Traço: ${trait.name}`);

        // Criar facetas
        for (let j = 0; j < traitData.facets.length; j++) {
            await prisma.bigFiveFacetConfig.create({
                data: {
                    trait: { connect: { id: trait.id } },
                    facetKey: `${traitData.key}_F${j + 1}`,
                    name: traitData.facets[j],
                    weight: 1.0,
                    isActive: true,
                    description: ''
                }
            });
        }
        console.log(`   📋 ${traitData.facets.length} facetas criadas\n`);
    }

    console.log('\n✅ CONFIGURAÇÃO COMPLETA CRIADA COM SUCESSO!');
    console.log(`\nID da Config: ${config.id}`);
    console.log(`Status: ATIVA`);
    console.log(`Traços: 5`);
    console.log(`Facetas: 30 (6 por traço)`);
    console.log('\n🎯 Agora você pode editar inventários e as facetas aparecerão!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
