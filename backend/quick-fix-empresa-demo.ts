import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quick() {
  // Ativar config existente no tenant Empresa Demo
  const betels = await prisma.bigFiveConfig.findMany({
    where: { tenantId: 'c2c1f3a8-d1a7-48fc-abd9-1f783e2f2246' }
  });
  
  if (betels.length > 0) {
    // Desativar todas
    await prisma.bigFiveConfig.updateMany({
      where: { tenantId: 'c2c1f3a8-d1a7-48fc-abd9-1f783e2f2246' },
      data: { isActive: false }
    });
  }
  
  // Pegar uma config ativa de outro tenant como modelo
  const model = await prisma.bigFiveConfig.findFirst({
    where: {
      isActive: true,
      traits: { some: {} }
    },
    include: {
      traits: {
        include: { facets: true }
      }
    }
  });
  
  if (!model) {
    console.log('❌ Nenhum modelo encontrado');
    return;
  }
  
  // Criar nova config para Empresa Demo
  const newConfig = await prisma.bigFiveConfig.create({
    data: {
      tenantId: 'c2c1f3a8-d1a7-48fc-abd9-1f783e2f2246',
      isActive: true,
      name: 'Configuração Padrão Big Five',
      veryLowMax: model.veryLowMax,
      lowMax: model.lowMax,
      averageMax: model.averageMax,
      highMax: model.highMax,
      primaryColor: model.primaryColor,
      reportHeader: model.reportHeader,
      reportFooter: model.reportFooter
    }
  });
  
  console.log('✅ Config criada:', newConfig.id);
  
  // Copiar traços e facetas
  for (const trait of model.traits) {
    const newTrait = await prisma.bigFiveTraitConfig.create({
      data: {
        configId: newConfig.id,
        traitKey: trait.traitKey,
        name: trait.name,
        icon: trait.icon,
        weight: trait.weight,
        description: trait.description,
        veryLowText: trait.veryLowText,
        lowText: trait.lowText,
        averageText: trait.averageText,
        highText: trait.highText,
        veryHighText: trait.veryHighText
      }
    });
    
    for (const facet of trait.facets) {
      await prisma.bigFiveFacetConfig.create({
        data: {
          traitId: newTrait.id,
          facetKey: facet.facetKey,
          name: facet.name,
          weight: facet.weight,
          description: facet.description
        }
      });
    }
  }
  
  console.log('✅ 5 traços + 20 facetas copiados!');
 console.log('\n🎉 Tenant "Empresa Demo" agora tem config ativa!');
  
  await prisma.$disconnect();
}

quick();
