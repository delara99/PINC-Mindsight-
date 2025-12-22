import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛡️ Iniciando Preenchimento Forçado de Textos (Garantia de Visualização)...');

  // Buscar configurações (Prioridade: ID no Env, depois Ativa)
  let configs = [];
  if (process.env.TARGET_CONFIG_ID) {
      configs = await prisma.bigFiveConfig.findMany({ 
          where: { id: process.env.TARGET_CONFIG_ID },
          include: { traits: true }
      });
  } else {
      configs = await prisma.bigFiveConfig.findMany({
        where: { isActive: true },
        include: { traits: true }
      });
  }

  if (configs.length === 0) {
     // Fallback
     const last = await prisma.bigFiveConfig.findFirst({ 
         orderBy: { createdAt: 'desc' },
         include: { traits: true }
     });
     if (last) configs.push(last);
  }

  if (configs.length === 0) {
      console.error('❌ Nenhuma configuração encontrada.');
      return;
  }

  const ranges = ['VERY_LOW', 'LOW', 'AVERAGE', 'HIGH', 'VERY_HIGH'];

  for (const config of configs) {
      console.log(`👉 Config: ${config.name} (${config.id})`);
      console.log(`   Possui ${config.traits.length} traços configurados.`);

      for (const trait of config.traits) {
          // Tentar chaves possiveis
          const tKey = trait.traitKey || trait.key; 
          console.log(`   🔹 Processando Traço: ${trait.name} (Key: ${tKey})`);
          
          if (!tKey) { 
              console.log('Skipping trait without key'); continue; 
          }

          for (const range of ranges) {
              const exists = await prisma.bigFiveInterpretativeText.findFirst({
                  where: {
                      configId: config.id,
                      traitKey: tKey,
                      scoreRange: range as any // Cast para evitar erro de TS se enum
                  }
              });

              if (!exists) {
                  await prisma.bigFiveInterpretativeText.create({
                      data: {
                          configId: config.id,
                          traitKey: tKey,
                          scoreRange: range as any,
                          category: 'SUMMARY',
                          context: 'Visão Geral',
                          text: `[Auto] O participante apresenta nível ${range} em ${trait.name}. Texto gerado automaticamente para validação.`
                      }
                  });
                  console.log(`      ➕ Criado texto placeholder para [${range}]`);
              }
          }
      }
  }
  console.log('🎉 Concluído! Agora todas as faixas possuem pelo menos um texto.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
