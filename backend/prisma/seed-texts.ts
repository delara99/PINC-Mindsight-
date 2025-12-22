import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando inserção de textos interpretativos...');

  // Buscar configurações ativas
  const configs = await prisma.bigFiveConfig.findMany({
    where: { isActive: true }
  });

  if (configs.length === 0) {
    console.log('⚠️ Nenhuma configuração ativa encontrada. Buscando a mais recente...');
    const lastConfig = await prisma.bigFiveConfig.findFirst({ orderBy: { createdAt: 'desc' } });
    if (lastConfig) configs.push(lastConfig);
    else {
        console.error('❌ Erro: Nenhuma configuração Big Five encontrada no sistema.');
        return;
    }
  }

  const textsToInsert = [
    // === AMABILIDADE (AGREEABLENESS) ===
    {
      trait: 'AGREEABLENESS', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
      text: 'Você tende a se comunicar de forma direta e objetiva, priorizando clareza e eficiência. Pode parecer mais assertivo ou reservado emocionalmente, o que favorece decisões rápidas, mas exige atenção à sensibilidade do outro.'
    },
    {
      trait: 'AGREEABLENESS', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Relações Interpessoais',
      text: 'Seu perfil favorece autonomia e independência nas relações. Você tende a valorizar limites claros, podendo parecer menos flexível em situações que exigem concessões emocionais.'
    },
    {
      trait: 'AGREEABLENESS', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
      text: 'Em situações de pressão, você tende a focar na solução do problema, mantendo postura racional. Pode minimizar aspectos emocionais para preservar controle.'
    },
    {
      trait: 'AGREEABLENESS', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
      text: 'Você consegue equilibrar empatia e objetividade ao se comunicar. Sabe ouvir, mas também expressar seus pontos de vista com clareza.'
    },
    {
      trait: 'AGREEABLENESS', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Relações Interpessoais',
      text: 'Seu perfil favorece relações estáveis, com capacidade de cooperação sem abrir mão da individualidade.'
    },
    {
      trait: 'AGREEABLENESS', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
      text: 'Você tende a se comunicar de forma acolhedora e empática, buscando compreensão mútua. Sua escuta ativa fortalece vínculos.'
    },
    {
      trait: 'AGREEABLENESS', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Relações Interpessoais',
      text: 'Relações humanas são centrais para você. Há forte inclinação à cooperação, apoio e manutenção da harmonia.'
    },

    // === EXTROVERSÃO (EXTRAVERSION) ===
    {
      trait: 'EXTRAVERSION', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
      text: 'Você tende a se comunicar de forma mais reservada, priorizando qualidade da interação em vez de quantidade. Prefere conversas profundas e objetivas.'
    },
    {
      trait: 'EXTRAVERSION', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Ambiente Profissional',
      text: 'Seu perfil favorece ambientes dinâmicos, colaborativos e com alta interação social. Você tende a se energizar com pessoas e trocas constantes.'
    },

    // === CONSCIENCIOSIDADE (CONSCIENTIOUSNESS) ===
    {
      trait: 'CONSCIENTIOUSNESS', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Tomada de Decisão',
      text: 'Você tende a tomar decisões de forma planejada, analisando riscos e consequências. Organização e responsabilidade orientam suas escolhas.'
    },
    {
      trait: 'CONSCIENTIOUSNESS', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Organização / Rotina',
      text: 'Seu perfil favorece flexibilidade e adaptação, podendo preferir rotinas menos estruturadas e maior liberdade de ação.'
    },

    // === ABERTURA (OPENNESS) ===
    {
        trait: 'OPENNESS', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Mudanças',
        text: 'Você tende a lidar bem com mudanças, demonstrando curiosidade e abertura para novas ideias, métodos e experiências.'
    },

    // === ESTABILIDADE EMOCIONAL (NEUROTICISM - INVERTIDO) ===
    // Baixa Estabilidade = Alto Neuroticismo (HIGH)
    {
        trait: 'NEUROTICISM', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
        text: 'Em contextos de pressão, você pode vivenciar emoções de forma mais intensa. Estratégias de autorregulação ajudam a manter o equilíbrio.'
    },
    // Alta Estabilidade = Baixo Neuroticismo (LOW)
    {
        trait: 'NEUROTICISM', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
        text: 'Você tende a manter estabilidade emocional mesmo sob pressão, lidando com desafios de forma racional e equilibrada.'
    }
  ];

  for (const config of configs) {
    console.log(`👉 Processando Configuração: ${config.name} (ID: ${config.id})`);
    
    let addedCount = 0;
    for (const item of textsToInsert) {
        // Verificar duplicidade
        const exists = await prisma.bigFiveInterpretativeText.findFirst({
            where: {
                configId: config.id,
                traitKey: item.trait,
                scoreRange: item.range,
                category: item.category,
                context: item.context
            }
        });

        if (!exists) {
            await prisma.bigFiveInterpretativeText.create({
                data: {
                    configId: config.id,
                    traitKey: item.trait,
                    scoreRange: item.range,
                    category: item.category,
                    context: item.context,
                    text: item.text
                }
            });
            console.log(`   ✅ Criado: ${item.trait} | ${item.range} | ${item.context}`);
            addedCount++;
        }
    }
    console.log(`   > Total de textos inseridos nesta config: ${addedCount}`);
  }

  console.log('🎉 Sucesso! Todos os textos foram processados.');
}

main()
  .catch((e) => {
    console.error('❌ Erro Fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
